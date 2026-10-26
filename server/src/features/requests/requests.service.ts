import { requestsRepository } from "./requests.repository";
import { postsRepository } from "../posts/posts.repository";
import type { NotificationType } from "../notifications/notifications.types";
import type {Quote,RequestAction,RequesttWithProvider as RequestWithProvider,ServiceRequest,ServiceStatus,Transition,} from "./requests.types";

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

// Calcula cuanto cuesta el servicio segun las horas
const getQuote = async (postId: string, hours: number): Promise<Quote | undefined> => {
  const post = await postsRepository.findById(postId);
  if (!post) return undefined;

  const pricePerHour = post.price ?? DEFAULT_PRICE_PER_HOUR;

  return {
    post_id: post.id,
    provider_id: post.user_id,
    hours,
    price_per_hour: pricePerHour,
    total: pricePerHour * hours,
  };
};

// Dice a que estado pasa la solicitud. Si la accion no se puede hacer devuelve undefined
const getTransition = (status: ServiceStatus, action: RequestAction): Transition | undefined => {
  const rule = TRANSITIONS[action];
  if (!rule.from.includes(status)) return undefined;

  return { status: rule.to, notification_type: rule.notification };
};

export const requestsService = {getAll,getById,getCurrent,getQuote,getTransition,};
