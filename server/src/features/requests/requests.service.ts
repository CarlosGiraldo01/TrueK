import { requestsRepository } from "./requests.repository";
import Boom from "@hapi/boom";
import { postsRepository } from "../posts/posts.repository";
import { uploadsService } from "../uploads/uploads.service";
import type { NotificationType } from "../notifications/notifications.types";
import type {CreateRequestInput,Quote,RequestAction,RequesttWithProvider as RequestWithProvider,ServiceRequest,ServiceStatus,Transition,} from "./requests.types";

// Precio por hora si la publicacion no tiene uno
const DEFAULT_PRICE_PER_HOUR = 10000;

// Orden para elegir que solicitud se ve en la pestaña Servicios (menor numero = mas importante)
    const STATUS_PRIORITY: Record<ServiceStatus, number> = {
        active: 0,
        accepted: 1,
        pending: 2,
        finished: 3,
        rejected: 4,
        cancelled: 5,
      };

// Reglas de cambio de estado: desde que estados se puede hacer cada accion,
// a que estado pasa y que aviso le llega al cliente
const TRANSITIONS: Record<RequestAction, { from: ServiceStatus[]; to: ServiceStatus; notification: NotificationType }> = {
  accept: { from: ["pending"], to: "accepted", notification: "request_accepted" },
  reject: { from: ["pending"], to: "rejected", notification: "request_rejected" },
  finish: { from: ["accepted", "active"], to: "finished", notification: "services_finished" },
};

// Le agrega a la solicitud el id del prestador buscando su publicacion
const addProvider = async (request: ServiceRequest): Promise<RequestWithProvider> => {
  const post = await postsRepository.findById(request.post_id);
  return { ...request, provider_id: post ? post.user_id : null };
};

const getAll = async (): Promise<RequestWithProvider[]> => {
  const requests = await requestsRepository.findAll();
  return Promise.all(requests.map(addProvider));
};

const getById = async (id: string): Promise<RequestWithProvider | undefined> => {
  const request = await requestsRepository.findById(id);
  if (!request) return undefined;
  return addProvider(request);
};

// La solicitud que el usuario ve ahora mismo en la pestaña Servicios
const getCurrent = async (userId: string): Promise<RequestWithProvider | null> => {
  const requests = await getAll();

  const visible = requests.filter((request) => {
    if (request.status === "cancelled") return false;
    if (request.status === "finished" && request.payment_confirmed) return false;
    if (request.client_id === userId) return true;
    // El prestador no vuelve a ver las que rechazo
    return request.provider_id === userId && request.status !== "rejected";
  });

  if (visible.length === 0) return null;

  visible.sort(
    (a, b) =>
      STATUS_PRIORITY[a.status as ServiceStatus] -
      STATUS_PRIORITY[b.status as ServiceStatus],
  );
  return visible[0];
};

// Precio por hora de la publicacion y total; lo comparten la cotizacion y la creacion
const computePricing = (post: { price?: number | null }, hours: number): { pricePerHour: number; total: number } => {
  const pricePerHour = post.price ?? DEFAULT_PRICE_PER_HOUR;
  return { pricePerHour, total: pricePerHour * hours };
};

// Calcula cuanto cuesta el servicio segun las horas
const getQuote = async (postId: string, hours: number): Promise<Quote | undefined> => {
  const post = await postsRepository.findById(postId);
  if (!post) return undefined;

  const { pricePerHour, total } = computePricing(post, hours);

  return {
    post_id: post.id,
    provider_id: post.user_id,
    hours,
    price_per_hour: pricePerHour,
    total,
  };
};

// Mismo texto que los avisos sembrados de este tipo y que el componente NotificationServiceRequest del cliente
const INCOMING_SERVICES_MESSAGE = "Solicita tus servicios de:";

// Crea la solicitud (precio calculado en el servidor) y el aviso para el prestador,
// los dos en una sola query atómica (ver requestsRepository.create).
const create = async (clientId: string, input: CreateRequestInput): Promise<RequestWithProvider> => {
  const post = await postsRepository.findById(input.post_id);
  if (!post) throw Boom.notFound("Publicación no encontrada");

  if (post.user_id === clientId) {
    throw Boom.conflict("No puedes solicitar tu propio servicio");
  }

  const requestImage = input.request_image ?? null;
  if (requestImage !== null && !uploadsService.isUserImageUrl(requestImage, clientId)) {
    throw Boom.badRequest("La imagen no pertenece al usuario");
  }

  const request = await requestsRepository.create({
    post_id: post.id,
    client_id: clientId,
    meeting_address: input.meeting_address,
    meeting_date: input.meeting_date,
    hours: input.hours,
    request_image: requestImage,
    price: computePricing(post, input.hours).total,
    provider_id: post.user_id,
    notification_message: INCOMING_SERVICES_MESSAGE,
  });

  return { ...request, provider_id: post.user_id };
};

// Dice a que estado pasa la solicitud. Si la accion no se puede hacer devuelve undefined
const getTransition = (status: ServiceStatus, action: RequestAction): Transition | undefined => {
  const rule = TRANSITIONS[action];
  if (!rule.from.includes(status)) return undefined;

  return { status: rule.to, notification_type: rule.notification };
};

// Mismo texto que los avisos sembrados de cada tipo (ver notifications/data.mock.ts)
const TRANSITION_MESSAGES: Record<"request_accepted" | "request_rejected" | "services_finished", string> = {
  request_accepted: "Ha aceptado tu solicitud",
  request_rejected: "Ha rechazado tu solicitud",
  services_finished: "Tu servicio ha terminado!",
};

// Cambia el estado de la solicitud y avisa a la otra parte, todo en una sola query atómica
// (ver requestsRepository.updateStatus).
const transition = async (actorId: string, id: string, action: RequestAction): Promise<RequestWithProvider> => {
  const request = await requestsRepository.findById(id);
  if (!request) throw Boom.notFound("Solicitud no encontrada");

  const { provider_id: providerId } = await addProvider(request);
  if (providerId === null) throw Boom.notFound("Publicación no encontrada");

  // 403 deliberado (a pedido del usuario) aunque la regla general prefiere 404 para recursos ajenos.
  if (action === "finish") {
    if (actorId !== request.client_id && actorId !== providerId) {
      throw Boom.forbidden("No tienes permiso sobre esta solicitud");
    }
  } else if (actorId !== providerId) {
    throw Boom.forbidden("Solo el prestador puede aceptar o rechazar");
  }

  const next = getTransition(request.status, action);
  if (!next) {
    throw Boom.conflict(`No se puede hacer "${action}" con una solicitud en estado "${request.status}"`);
  }

  // El aviso siempre le llega a la otra parte
  const recipientId = actorId === request.client_id ? providerId : request.client_id;
  const message = TRANSITION_MESSAGES[next.notification_type as keyof typeof TRANSITION_MESSAGES];

  const updated = await requestsRepository.updateStatus(id, request.status, next.status, {
    user_id: recipientId,
    type: next.notification_type,
    message,
  });
  if (!updated) throw Boom.conflict("La solicitud cambió de estado, vuelve a intentarlo");

  return { ...updated, provider_id: providerId };
};

export const requestsService = {getAll,getById,getCurrent,getQuote,getTransition,create,transition,};
