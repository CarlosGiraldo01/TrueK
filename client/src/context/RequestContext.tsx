// Guarda y maneja las solicitudes de servicio de la app.
// Las reglas (qué solicitud se ve, cuánto cuesta, a qué estado pasa, qué aviso sale)
// las decide el servidor. Aquí solo se piden con axios y se guarda lo que responde.
// Como el servidor solo tiene GET, lo que se crea o cambia en la sesión vive en memoria.

"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useSession } from "./SessionContext";
import { useNotifications } from "./NotificationsContext";
import { usePosts } from "./PostsContext";
import { useUsers } from "./UsersContext";
import type {Notification,NotificationType,Quote,Rating,RequestAction,ServiceRequest,ServiceStatus,Transition,} from "@/types";

// Tiempos de espera de las simulaciones (1000 = 1 segundo).
const PROVIDER_RESPONSE_DELAY = 6000; // El prestador acepta.
const PROVIDER_FINISH_DELAY = 12000; // El prestador termina.
const CLIENT_RATING_DELAY = 4000; // El cliente califica.
const INCOMING_REQUEST_DELAY = 2500; // Al prestador le llega el aviso de solicitud nueva.

// Datos del formulario "Agendar Servicio" antes de confirmar.
export interface ScheduleDraft {
  post_id: string;
  client_name: string;
  meeting_address: string;
  hours: number;
  date: string; // ej: "2026-11-14"
  time: string; // ej: "16:00"
  request_image: string | null;
}

// Papel del usuario en una solicitud.
export type RequestRole = "client" | "provider";

interface RequestsContextValue {
  requests: ServiceRequest[];
  loading: boolean;
  error: string | null;
  getRequest: (id: string) => ServiceRequest | undefined;
  currentRequest: ServiceRequest | undefined; // La que se ve en la pestaña Servicios.
  getRole: (request: ServiceRequest) => RequestRole | null;

  draft: ScheduleDraft | null;
  saveDraft: (draft: ScheduleDraft) => void;
  quote: Quote | null; // Precio que calculó el servidor para el formulario.
  quoteLoading: boolean;
  quoteError: string | null;
  createRequest: () => ServiceRequest | null;
  lastCreatedId: string | null;

  acceptRequest: (id: string) => Promise<void>;
  rejectRequest: (id: string) => Promise<void>;
  finishRequest: (id: string) => Promise<void>;
  closeRequest: (id: string) => void;

  getRating: (requestId: string) => Rating | undefined;
  getUserRating: (userId: string) => number;
  addRating: (requestId: string, rating: Rating["rating"], comment: string) => void;

  simulateProviderFinish: (id: string) => () => void;
  simulateClientRating: (id: string) => () => void;
}

const RequestsContext = createContext<RequestsContextValue | null>(null);

export const RequestsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useSession();
  const { showNotification } = useNotifications();
  const { getPostById } = usePosts();
  const { getUserById } = useUsers();
  const userId = user?.id;

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [averages, setAverages] = useState<Record<string, number>>({}); // Promedios que calcula el servidor.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serverCurrentId, setServerCurrentId] = useState<string | null>(null); // La que eligió el servidor.
  const [closedIds, setClosedIds] = useState<string[]>([]);
  const [createdIds, setCreatedIds] = useState<string[]>([]);
  const [draft, setDraft] = useState<ScheduleDraft | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);

  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const notifiedIncoming = useRef(new Set<string>()); // Avisos que ya se mostraron.
  const requestsRef = useRef<ServiceRequest[]>([]); // Copia para los temporizadores.

  // Al abrir la app pide las solicitudes, las calificaciones y los promedios.
  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api.get<ServiceRequest[]>("/requests"),
      api.get<Rating[]>("/ratings"),
      api.get<Record<string, number>>("/ratings/averages"),
    ])
      .then(([requestsRes, ratingsRes, averagesRes]) => {
        if (cancelled) return;
        setRequests(requestsRes.data);
        setRatings(ratingsRes.data);
        setAverages(averagesRes.data);
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

  // Cada vez que cambia el usuario, el servidor dice cuál es su solicitud actual.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    api
      .get<ServiceRequest | null>(`/requests/current/${userId}`)
      .then((res: { data: ServiceRequest | null }) => {
        if (!cancelled) setServerCurrentId(res.data ? res.data.id : null);
      })
      .catch(() => {
        if (!cancelled) setServerCurrentId(null);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    requestsRef.current = requests;
  }, [requests]);

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

  const getRequest = useCallback((id: string) => requests.find((r) => r.id === id), [requests]);

  // provider_id ya viene del servidor, solo comparamos con el usuario.
  const getRole = useCallback(
    (request: ServiceRequest): RequestRole | null => {
      if (!userId) return null;
      if (request.client_id === userId) return "client";
      if (request.provider_id === userId) return "provider";
      return null;
    },
    [userId],
  );

  // Si el usuario pidió algo en esta sesión se muestra eso; si no, la que eligió el servidor.
  const createdByMe = requests.find(
    (r) => createdIds.includes(r.id) && r.client_id === userId && !closedIds.includes(r.id),
  );
  const fromServer = requests.find((r) => r.id === serverCurrentId && !closedIds.includes(r.id));
  const currentRequest = createdByMe ?? fromServer;

  const updateStatus = useCallback((id: string, status: ServiceStatus) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }, []);

  // Muestra al cliente el aviso que decidió el servidor.
  const notifyClient = useCallback(
    (request: ServiceRequest, type: NotificationType) => {
      const provider = request.provider_id ? getUserById(request.provider_id) : undefined;
      showNotification({
        type,
        name: provider?.name ?? "Prestador",
        avatarUrl: provider?.profile_picture ?? undefined,
        href: type === "services_finished" ? `/requests/${request.id}/rating` : `/requests/${request.id}`,
      });
    },
    [showNotification, getUserById],
  );

  // Le pregunta al servidor a qué estado pasa la solicitud con esa acción.
  // Si notify es true, también muestra el aviso que el servidor dijo.
  const changeStatus = useCallback(
    async (id: string, action: RequestAction, notify: boolean) => {
      const request = requestsRef.current.find((r) => r.id === id);
      if (!request) return;

      try {
        const res = await api.get<Transition>("/requests/transition", {
          params: { status: request.status, action },
        });
        updateStatus(id, res.data.status);
        if (notify) notifyClient(request, res.data.notification_type);
      } catch {
        // El servidor responde 400 si la acción no se puede hacer en ese estado: no se cambia nada.
      }
    },
    [updateStatus, notifyClient],
  );

  const getUserRating = useCallback((id: string) => averages[id] ?? 0, [averages]);

  // Guarda el formulario y le pide al servidor el precio.
  const saveDraft = useCallback((newDraft: ScheduleDraft) => {
    setDraft(newDraft);
    setQuote(null);
    setQuoteError(null);
    setQuoteLoading(true);

    api
      .get<Quote>("/requests/quote", { params: { post_id: newDraft.post_id, hours: newDraft.hours } })
      .then((res: { data: Quote }) => setQuote(res.data))
      .catch(() => setQuoteError("No se pudo calcular el precio"))
      .finally(() => setQuoteLoading(false));
  }, []);

  // Crea la solicitud con el formulario y el precio que dio el servidor.
  const createRequest = useCallback(() => {
    if (!draft || !userId || !quote) return null;

    const request: ServiceRequest = {
      id: `r${Date.now()}`,
      post_id: draft.post_id,
      client_id: userId,
      provider_id: quote.provider_id,
      meeting_address: draft.meeting_address,
      meeting_date: `${draft.date}T${draft.time}`,
      hours: draft.hours,
      status: "pending",
      request_image: draft.request_image,
      payment_confirmed: false,
      price: quote.total,
    };
    setRequests((prev) => [request, ...prev]);
    setCreatedIds((prev) => [request.id, ...prev]);
    setLastCreatedId(request.id);
    setDraft(null);
    setQuote(null);

    // Simula que el prestador acepta a los 6 segundos.
    schedule(() => {
      changeStatus(request.id, "accept", true);
    }, PROVIDER_RESPONSE_DELAY);

    return request;
  }, [draft, userId, quote, schedule, changeStatus]);

  // Oculta una solicitud de la pestaña Servicios.
  const closeRequest = useCallback((id: string) => {
    setClosedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  // Acciones del prestador.
  const acceptRequest = useCallback((id: string) => changeStatus(id, "accept", false), [changeStatus]);
  const finishRequest = useCallback((id: string) => changeStatus(id, "finish", false), [changeStatus]);
  // Si rechaza, vuelve a "Servicios vacío".
  const rejectRequest = useCallback(
    async (id: string) => {
      await changeStatus(id, "reject", false);
      closeRequest(id);
    },
    [changeStatus, closeRequest],
  );

  const getRating = useCallback(
    (requestId: string) => ratings.find((r) => r.service_request_id === requestId),
    [ratings],
  );

  // Guarda la calificación del cliente al prestador (reemplaza si ya existía).
  const addRating = useCallback((requestId: string, rating: Rating["rating"], comment: string) => {
    const request = requestsRef.current.find((r) => r.id === requestId);
    setRatings((prev) => [
      ...prev.filter((r) => r.service_request_id !== requestId),
      { id: `g${Date.now()}`, service_request_id: requestId, rated_user_id: request?.provider_id ?? "", rating, comment },
    ]);
  }, []);

  // Simula que el prestador termina el servicio a los 12 segundos y avisa al cliente.
  const simulateProviderFinish = useCallback(
    (id: string) =>
      schedule(() => {
        changeStatus(id, "finish", true);
      }, PROVIDER_FINISH_DELAY),
    [schedule, changeStatus],
  );

  // Simula que el cliente califica al prestador con 4 estrellas a los 4 segundos.
  const simulateClientRating = useCallback(
    (id: string) =>
      schedule(() => {
        setRatings((prev) => {
          if (prev.some((r) => r.service_request_id === id)) return prev;
          const request = requestsRef.current.find((r) => r.id === id);
          return [
            ...prev,
            {
              id: `g${Date.now()}`,
              service_request_id: id,
              rated_user_id: request?.provider_id ?? "",
              rating: 4,
              comment: "Me gustó mucho el plan, fue muy puntual y amable. ¡Lo volvería a pedir!",
            },
          ];
        });
      }, CLIENT_RATING_DELAY),
    [schedule],
  );

  // Pide al servidor los avisos de "solicitud nueva" del usuario y los muestra una sola vez.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    api
      .get<Notification[]>("/notifications", { params: { user_id: userId, type: "incoming_services" } })
      .then((res: { data: Notification[] }) => {
        if (cancelled) return;
        res.data.forEach((notification) => {
          if (notifiedIncoming.current.has(notification.id)) return;
          notifiedIncoming.current.add(notification.id);

          schedule(() => {
            const request = requestsRef.current.find((r) => r.id === notification.service_request_id);
            const client = request ? getUserById(request.client_id) : undefined;
            const post = request ? getPostById(request.post_id) : undefined;
            showNotification({
              type: notification.type,
              name: client?.name ?? "Cliente",
              avatarUrl: client?.profile_picture ?? undefined,
              tag: post?.tags[0],
              href: `/requests/${notification.service_request_id}`,
            });
          }, INCOMING_REQUEST_DELAY);
        });
      })
      .catch(() => {
        // Si fallan los avisos la app sigue funcionando.
      });

    return () => {
      cancelled = true;
    };
  }, [userId, schedule, showNotification, getUserById, getPostById]);

  const value: RequestsContextValue = {requests,loading,error,getRequest,currentRequest,getRole,draft,saveDraft,quote,quoteLoading,quoteError,createRequest,lastCreatedId,acceptRequest,rejectRequest,finishRequest,closeRequest,getRating,getUserRating,addRating,simulateProviderFinish,simulateClientRating,};

  return <RequestsContext.Provider value={value}>{children}</RequestsContext.Provider>;};

export const useRequests = () => {
  const context = useContext(RequestsContext);

  if (!context) {
    throw new Error("useRequests must be used within a RequestsProvider");
  }
  return context;
};
