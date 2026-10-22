// Guarda y maneja todas las solicitudes de servicio de la app.
// Todas las pantallas lo usan para leer o cambiar solicitudes.
// Los datos iniciales llegan del servidor (solo GET); crear, cambiar estado y calificar
// vive en memoria y algunas acciones se simulan.

"use client"; // Corre en el navegador.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api"; // Axios, para pedir los datos al servidor.
import { useSession } from "./SessionContext"; // Para saber quién inició sesión.
import { useNotifications } from "./NotificationsContext"; // Para mostrar avisos.
import { usePosts } from "./PostsContext"; // Para buscar publicaciones.
import { useUsers } from "./UsersContext"; // Para buscar usuarios.
import type { Rating, ServiceRequest, ServiceStatus } from "@/types";

// Tiempos de espera de las simulaciones (1000 = 1 segundo).
const PROVIDER_RESPONSE_DELAY = 6000; // El prestador acepta.
const PROVIDER_FINISH_DELAY = 12000; // El prestador termina.
const CLIENT_RATING_DELAY = 4000; // El cliente califica.
const INCOMING_REQUEST_DELAY = 2500; // Al prestador le llega el aviso de solicitud nueva.

// Datos del formulario "Agendar Servicio" antes de confirmar.
export interface ScheduleDraft {
  post_id: string; // Servicio elegido.
  client_name: string; // Nombre del cliente.
  meeting_address: string; // Dirección del encuentro.
  hours: number; // Cantidad de horas.
  date: string; // Fecha, ej: "2026-11-14".
  time: string; // Hora, ej: "16:00".
  request_image: string | null; // Foto opcional.
}

// Papel del usuario en una solicitud.
export type RequestRole = "client" | "provider";

// Lista de todo lo que este archivo ofrece a las pantallas.
interface RequestsContextValue {
  requests: ServiceRequest[]; // Todas las solicitudes.
  loading: boolean; // true mientras llegan los datos del servidor.
  error: string | null; // Mensaje si el servidor falló.
  getRequest: (id: string) => ServiceRequest | undefined; // Busca una solicitud por id.
  currentRequest: ServiceRequest | undefined; // La solicitud que se ve en la pestaña Servicios.
  getRole: (request: ServiceRequest) => RequestRole | null; // Dice si eres cliente o prestador.

  draft: ScheduleDraft | null; // Formulario guardado.
  saveDraft: (draft: ScheduleDraft) => void; // Guarda el formulario.
  createRequest: () => ServiceRequest | null; // Crea la solicitud con el formulario.
  lastCreatedId: string | null; // Id de la última solicitud creada.

  acceptRequest: (id: string) => void; // Prestador acepta.
  rejectRequest: (id: string) => void; // Prestador rechaza.
  finishRequest: (id: string) => void; // Prestador termina.
  closeRequest: (id: string) => void; // Oculta la solicitud de la pestaña Servicios.

  getRating: (requestId: string) => Rating | undefined; // Busca la calificación.
  getUserRating: (userId: string) => number; // Promedio de calificaciones que recibió un usuario.
  getHourlyRate: (postId: string) => number; // Precio por hora de un servicio.
  addRating: (requestId: string, rating: Rating["rating"], comment: string) => void; // Guarda la calificación.

  simulateProviderFinish: (id: string) => () => void; // Simula que el prestador termina.
  simulateClientRating: (id: string) => () => void; // Simula que el cliente califica.
}

// Crea el contexto (el lugar compartido).
const RequestsContext = createContext<RequestsContextValue | null>(null);

// Orden para elegir qué solicitud mostrar primero (menor número = más importante).
const STATUS_PRIORITY: Record<ServiceStatus, number> = {
  active: 0, // En curso.
  accepted: 1, // Aceptada.
  pending: 2, // Esperando respuesta.
  finished: 3, // Terminada.
  rejected: 4, // Rechazada.
  cancelled: 5, // Cancelada.
};

// Componente que comparte todos los datos y funciones con las pantallas.
export const RequestsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useSession(); // Usuario que inició sesión.
  const { showNotification } = useNotifications(); // Función para mostrar avisos.
  const { getPostById } = usePosts(); // Busca una publicación.
  const { getUserById } = useUsers(); // Busca un usuario.

  const [requests, setRequests] = useState<ServiceRequest[]>([]); // Lista de solicitudes.
  const [ratings, setRatings] = useState<Rating[]>([]); // Lista de calificaciones.
  const [loading, setLoading] = useState(true); // Esperando al servidor.
  const [error, setError] = useState<string | null>(null); // Error del servidor.
  const [closedIds, setClosedIds] = useState<string[]>([]); // Ids de solicitudes ocultas.
  const [createdIds, setCreatedIds] = useState<string[]>([]); // Ids creados en esta sesión.
  const [draft, setDraft] = useState<ScheduleDraft | null>(null); // Formulario guardado.
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null); // Última solicitud creada.

  const timers = useRef(new Set<ReturnType<typeof setTimeout>>()); // Temporizadores activos.
  const notifiedIncoming = useRef(new Set<string>()); // Solicitudes ya avisadas al prestador.
  const requestsRef = useRef<ServiceRequest[]>([]); // Copia de las solicitudes para los temporizadores.

  // Al abrir la app pide al servidor las solicitudes y las calificaciones.
  useEffect(() => {
    let cancelled = false;

    Promise.all([api.get<ServiceRequest[]>("/requests"), api.get<Rating[]>("/ratings")])
      .then(([requestsRes, ratingsRes]) => {
        if (cancelled) return;
        setRequests(requestsRes.data);
        setRatings(ratingsRes.data);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudieron cargar las solicitudes");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Mantiene la copia al día (los temporizadores la usan para no leer datos viejos).
  useEffect(() => {
    requestsRef.current = requests;
  }, [requests]);

  // Devuelve el id del prestador (el dueño de la publicación).
  const getProviderId = useCallback(
    (request: ServiceRequest) => getPostById(request.post_id)?.user_id,
    [getPostById],
  );

  // Al cerrar la app, apaga los temporizadores pendientes.
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  // Ejecuta algo después de un tiempo. Devuelve una función para cancelarlo.
  const schedule = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      callback();
    }, delay);
    timers.current.add(timer);
    return () => {
      clearTimeout(timer);
      timers.current.delete(timer);
    };
  }, []);

  // Busca una solicitud por id.
  const getRequest = useCallback((id: string) => requests.find((r) => r.id === id), [requests]);

  // Dice si el usuario es cliente o prestador en esta solicitud.
  // Para ver pantallas del prestador, hay que entrar con el dueño de la publicación.
  const getRole = useCallback(
    (request: ServiceRequest): RequestRole | null => {
      if (!user) return null; // Nadie inició sesión.
      if (request.client_id === user.id) return "client"; // Es quien pidió.
      if (getProviderId(request) === user.id) return "provider"; // Es quien ofrece.
      return null; // No tiene nada que ver.
    },
    [user, getProviderId],
  );

  // Elige la solicitud que se muestra en la pestaña Servicios.
  const currentRequest = useMemo(() => {
    if (!user) return undefined;
    // Se queda solo con las solicitudes que le sirven al usuario.
    const candidates = requests.filter((request) => {
      if (closedIds.includes(request.id) || request.status === "cancelled") return false; // Oculta o cancelada: no.
      if (request.status === "finished" && request.payment_confirmed) return false; // Terminada y pagada: no.
      if (request.client_id === user.id) return true; // Soy el cliente: sí.
      return getProviderId(request) === user.id && request.status !== "rejected"; // Soy prestador y no la rechacé: sí.
    });
    // Si creé una solicitud en esta sesión, muestro la más nueva.
    const madeHere = requests.some((r) => createdIds.includes(r.id) && r.client_id === user.id);
    if (madeHere) return candidates.find((r) => createdIds.includes(r.id));
    // Si no, muestro la más importante según STATUS_PRIORITY.
    return [...candidates].sort((a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status])[0];
  }, [requests, closedIds, createdIds, user, getProviderId]);

  // Cambia el estado de una solicitud.
  const updateStatus = useCallback((id: string, status: ServiceStatus) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }, []);

  // Muestra un aviso al cliente cuando el prestador acepta, rechaza o termina.
  const notifyAbout = useCallback(
    (request: ServiceRequest, type: "request_accepted" | "request_rejected" | "services_finished") => {
      const providerId = getProviderId(request);
      const provider = providerId ? getUserById(providerId) : undefined;
      showNotification({
        type,
        name: provider?.name ?? "Prestador",
        avatarUrl: provider?.profile_picture ?? undefined,
        // Si terminó, lleva a calificar; si no, al detalle.
        href: type === "services_finished" ? `/requests/${request.id}/rating` : `/requests/${request.id}`,
      });
    },
    [showNotification, getProviderId, getUserById],
  );

  // Averigua cuánto cuesta UNA hora de un servicio.
  const getHourlyRate = useCallback(
    (postId: string) => {
      // Si la publicación ya tiene precio (lo pone "Crea un truek"), usamos ese.
      const post = getPostById(postId);
      if (post?.price) return post.price;

      // Si no, lo sacamos de una solicitud de esa publicación.
      const sample = requests.find((r) => r.post_id === postId && r.hours > 0);
      return sample ? Math.round(sample.price / sample.hours) : 10000;
    },
    [getPostById, requests],
  );

  // Promedio de las calificaciones que recibió un usuario (0 si no tiene).
  const getUserRating = useCallback(
    (userId: string) => {
      const received = ratings.filter((r) => r.rated_user_id === userId);
      if (received.length === 0) return 0;
      return received.reduce((sum, r) => sum + r.rating, 0) / received.length;
    },
    [ratings],
  );

  // Guarda el formulario.
  const saveDraft = useCallback((newDraft: ScheduleDraft) => setDraft(newDraft), []);

  // Crea una solicitud nueva con los datos del formulario.
  const createRequest = useCallback(() => {
    if (!draft || !user) return null;
    const pricePerHour = getHourlyRate(draft.post_id);
    const request: ServiceRequest = {
      id: `r${Date.now()}`, // Id único.
      post_id: draft.post_id,
      client_id: user.id, // El usuario actual es el cliente.
      meeting_address: draft.meeting_address,
      meeting_date: `${draft.date}T${draft.time}`, // Une fecha y hora.
      hours: draft.hours,
      status: "pending", // Empieza esperando respuesta.
      request_image: draft.request_image,
      payment_confirmed: false, // Aún no pagada.
      price: pricePerHour * draft.hours, // Precio total.
    };
    setRequests((prev) => [request, ...prev]); // La agrega a la lista.
    setCreatedIds((prev) => [request.id, ...prev]); // La marca como creada en esta sesión.
    setLastCreatedId(request.id);
    setDraft(null); // Limpia el formulario.

    // Simula que el prestador acepta a los 6 segundos.
    schedule(() => {
      updateStatus(request.id, "accepted");
      notifyAbout(request, "request_accepted");
    }, PROVIDER_RESPONSE_DELAY);

    return request;
  }, [draft, user, getHourlyRate, schedule, updateStatus, notifyAbout]);

  // Acciones del prestador.
  const acceptRequest = useCallback((id: string) => updateStatus(id, "active"), [updateStatus]); // Aceptar.
  const rejectRequest = useCallback((id: string) => updateStatus(id, "rejected"), [updateStatus]); // Rechazar.
  const finishRequest = useCallback((id: string) => updateStatus(id, "finished"), [updateStatus]); // Terminar.

  // Oculta una solicitud de la pestaña Servicios.
  const closeRequest = useCallback((id: string) => {
    setClosedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  // Busca la calificación de una solicitud.
  const getRating = useCallback(
    (requestId: string) => ratings.find((r) => r.service_request_id === requestId),
    [ratings],
  );

  // Guarda la calificación del cliente al prestador (reemplaza si ya existía).
  const addRating = useCallback((requestId: string, rating: Rating["rating"], comment: string) => {
    const request = requestsRef.current.find((r) => r.id === requestId);
    const providerId = request ? getProviderId(request) : undefined;
    setRatings((prev) => [
      ...prev.filter((r) => r.service_request_id !== requestId),
      { id: `g${Date.now()}`, service_request_id: requestId, rated_user_id: providerId ?? "", rating, comment },
    ]);
  }, [getProviderId]);

  // Simula que el prestador termina el servicio a los 12 segundos y avisa al cliente.
  const simulateProviderFinish = useCallback(
    (id: string) =>
      schedule(() => {
        const request = requestsRef.current.find((r) => r.id === id);
        if (!request) return;
        updateStatus(id, "finished");
        notifyAbout(request, "services_finished");
      }, PROVIDER_FINISH_DELAY),
    [schedule, updateStatus, notifyAbout],
  );

  // Simula que el cliente califica al prestador con 4 estrellas a los 4 segundos.
  const simulateClientRating = useCallback(
    (id: string) =>
      schedule(() => {
        setRatings((prev) => {
          if (prev.some((r) => r.service_request_id === id)) return prev; // Si ya hay calificación, no hace nada.
          const request = requestsRef.current.find((r) => r.id === id);
          return [
            ...prev,
            {
              id: `g${Date.now()}`,
              service_request_id: id,
              rated_user_id: request ? (getProviderId(request) ?? "") : "",
              rating: 4,
              comment: "Me gustó mucho el plan, fue muy puntual y amable. ¡Lo volvería a pedir!",
            },
          ];
        });
      }, CLIENT_RATING_DELAY),
    [schedule, getProviderId],
  );

  // Si el usuario es prestador y tiene una solicitud pendiente, le muestra un aviso (una sola vez).
  useEffect(() => {
    if (!user) return;
    const incoming = requests.find(
      (r) => r.status === "pending" && getProviderId(r) === user.id && !notifiedIncoming.current.has(r.id),
    );
    if (!incoming) return;

    return schedule(() => {
      notifiedIncoming.current.add(incoming.id); // Marca como avisada.
      const client = getUserById(incoming.client_id);
      const post = getPostById(incoming.post_id);
      showNotification({
        type: "incoming_services",
        name: client?.name ?? "Cliente",
        avatarUrl: client?.profile_picture ?? undefined,
        tag: post?.tags[0],
        href: `/requests/${incoming.id}`,
      });
    }, INCOMING_REQUEST_DELAY);
  }, [user, requests, schedule, showNotification, getProviderId, getUserById, getPostById]);

  // Junta todo lo que se comparte con las pantallas.
  const value: RequestsContextValue = {requests,loading,error,getRequest,currentRequest,getRole,draft,saveDraft,createRequest,lastCreatedId,acceptRequest,rejectRequest,finishRequest,closeRequest,getRating,getUserRating,getHourlyRate,addRating,simulateProviderFinish,simulateClientRating,
  };

  // Entrega los datos a las pantallas que están dentro.
  return <RequestsContext.Provider value={value}>{children}</RequestsContext.Provider>;
};

// Función que usan las pantallas para acceder a las solicitudes.
export const useRequests = () => {
  const context = useContext(RequestsContext);

  // Error si se usa fuera de RequestsProvider.
  if (!context) {
    throw new Error("useRequests must be used within a RequestsProvider");
  }
  return context;
};