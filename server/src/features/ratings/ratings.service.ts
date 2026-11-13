import Boom from "@hapi/boom";
import { requestsService } from "../requests/requests.service";
import { ratingsRepository } from "./ratings.repository";
import type { CreateRatingInput, Rating } from "./ratings.types";

const getAverages = async () : Promise<Record<string, number>> =>{
  const rating = await ratingsRepository.findAll();
  const sums: Record<string,number> ={};
  const counts:Record<string,number> ={};

  rating.forEach((rating) => {
    const userId = rating.rated_user_id;
    sums [userId]= ( sums [userId]?? 0) + rating.rating;
    counts[userId]= (counts[userId] ?? 0) + 1;
  });
  const averages: Record<string, number> = {};
  Object.keys(sums).forEach((userId) => {
    averages[userId] = sums[userId] / counts[userId];
  });
  return averages
}

const create = async (input: CreateRatingInput): Promise<Rating> => {
  const request = await requestsService.getById(input.service_request_id);
  if (!request) {
    throw Boom.notFound("Solicitud no encontrada");
  }

  const isClient = request.client_id === input.rater_id;
  const isProvider = request.provider_id === input.rater_id;
  // 403 deliberado (a pedido del usuario) aunque la regla general prefiere 404 para recursos ajenos.
  if (!isClient && !isProvider) {
    throw Boom.forbidden("No participaste en esta solicitud");
  }

  if (request.status !== "finished") {
    throw Boom.conflict("Solo puedes calificar un servicio finalizado");
  }

  const ratedUserId = isClient ? request.provider_id : request.client_id;
  if (!ratedUserId) {
    throw Boom.conflict("La solicitud no tiene prestador");
  }

  if (ratedUserId === input.rater_id) {
    throw Boom.conflict("No puedes calificarte a ti mismo");
  }

  const existing = await ratingsRepository.findByRequestAndRatedUser(request.id, ratedUserId);
  if (existing) {
    throw Boom.conflict("Ya calificaste este servicio");
  }

  return ratingsRepository.create({
    service_request_id: request.id,
    rated_user_id: ratedUserId,
    rating: input.rating,
    comment: input.comment,
  });
};

export const ratingsService = {
  create,
  getAll: () => ratingsRepository.findAll(),
  getById: (id: string) => ratingsRepository.findById(id),
  getAverages,
};
//conecta con ratingsRepository para obtener y buscar calificaciones, y calcula el promedio de las puntuaciones que recibe cada usuario.