"use client";
//reune todas las llamadas
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useSession } from "./SessionContext";
import { useNotifications } from "./NotificationsContext";
import { usePosts } from "./PostsContext";
import { useUsers } from "./UsersContext";
import type {Notification,NotificationType,Quote,Rating,RequestAction,ServiceRequest,ServiceStatus,Transition,} from "@/types";
//centraliza y administra la información y las funciones de las solicitudes de servicios de Truek
// Espera antes de mostrar un aviso al entrar con un usuario (1000 = 1 segundo).
const NOTICE_DELAY = 1500;


export interface ScheduleDraft {
  post_id: string;
  client_name: string;
  meeting_address: string;
  hours: number;
  date: string; 
  time: string; 
  request_image: string | null;
}

// Papel del usuario en una solicitud.
export type RequestRole = "client" | "provider";

// Aviso que espera a que entre el usuario que lo debe ver.
interface PendingNotice {
  userId: string;
  requestId: string;
  type: NotificationType;
}

interface RequestsContextValue {
  requests: ServiceRequest[];
  loading: boolean;
  error: string | null;
  getRequest: (id: string) => ServiceRequest | undefined;
  currentRequest: ServiceRequest | undefined; 
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
  const [closedIds, setClosedIds] = useState<string[]>([]); // Guarda solicitud del usuario para que cada uno cierre las suyas.
  const [sessionIds, setSessionIds] = useState<string[]>([]); // Solicitudes creadas o respondidas en esta sesión.
  const [draft, setDraft] = useState<ScheduleDraft | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const notifiedIncoming = useRef(new Set<string>()); // Avisos del servidor que ya se mostraron.
  const pendingNotices = useRef<PendingNotice[]>([]); // Avisos para el otro usuario.
  const requestsRef = useRef<ServiceRequest[]>([]); // Copia para los temporizadores.

  // Al abrir la app pide las solicitudes, las calificaciones y los promedios.
  useEffect(() => {let cancelled = false;Promise.all([
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

  // Ejecuta algo después de un tiempo.
  const schedule = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      callback();
    }, delay);
    timers.current.add(timer);
  }, []);

  const getRequest = useCallback((id: string) => requests.find((r) => r.id === id), [requests]);

  // ya viene del servidor, solo comparamos con el usuario.
  const getRole = useCallback(
    (request: ServiceRequest): RequestRole | null => {
      if (!userId) return null;
      if (request.client_id === userId) return "client";
      if (request.provider_id === userId) return "provider";
      return null;
    },
    [userId],
  );

  // El usuario ve sus solicitudes El prestador no vuelve a ver las que rechazó.
  const isVisible = (request: ServiceRequest) => {
    if (!userId || closedIds.includes(`${userId}-${request.id}`)) return false;
    if (request.client_id === userId) return true;
    return request.provider_id === userId && request.status !== "rejected";
  };

  // Primero lo que pasó en esta sesión (lo más nuevo); si no hay, la que eligió el servidor.
  const fromSession = sessionIds
    .map((id) => requests.find((r) => r.id === id))
    .find((r) => r !== undefined && isVisible(r));
  const fromServer = requests.find((r) => r.id === serverCurrentId && isVisible(r));
  const currentRequest = fromSession ?? fromServer;

  const updateStatus = useCallback((id: string, status: ServiceStatus) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }, []);

  // Pone la solicitud de primera en la lista de la sesión.
  const markInSession = useCallback((id: string) => {
    setSessionIds((prev) => [id, ...prev.filter((item) => item !== id)]);
  }, []);

  // Deja guardado un aviso para que lo vea el otro usuario cuando entre.
  const addNotice = useCallback((notice: PendingNotice) => {
    pendingNotices.current = [...pendingNotices.current, notice];
  }, []);

  // Muestra un aviso. Si es una solicitud nueva se ve el cliente; si no, el prestador.
  const showNotice = useCallback(
    (request: ServiceRequest, type: NotificationType) => {
      const isIncoming = type === "incoming_services";
      const personId = isIncoming ? request.client_id : request.provider_id;
      const person = personId ? getUserById(personId) : undefined;
      const post = getPostById(request.post_id);

      showNotification({
        type,
        name: person?.name ?? (isIncoming ? "Cliente" : "Prestador"),
        avatarUrl: person?.profile_picture ?? undefined,
        tag: isIncoming ? post?.tags[0] : undefined,
        href: type === "services_finished" ? `/requests/${request.id}/rating` : `/requests/${request.id}`,
      });
    },
    [showNotification, getUserById, getPostById],
  );

  // Cuando entra un usuario, le muestra los avisos que le dejaron.
  useEffect(() => {
    if (!userId) return;

    const mine = pendingNotices.current.filter((notice) => notice.userId === userId);
    pendingNotices.current = pendingNotices.current.filter((notice) => notice.userId !== userId);

    mine.forEach((notice) => {
      schedule(() => {
        const request = requestsRef.current.find((r) => r.id === notice.requestId);
        if (request) showNotice(request, notice.type);
      }, NOTICE_DELAY);
    });
  }, [userId, schedule, showNotice]);

  // Le pregunta al servidor a qué estado pasa la solicitud con esa acción.
  // Si el cambio no se puede, el servidor responde 400 y no se cambia nada.
  const changeStatus = useCallback(
    async (id: string, action: RequestAction) => {
      const request = requestsRef.current.find((r) => r.id === id);
      if (!request) return;

      try {
        const res = await api.get<Transition>("/requests/transition", {
          params: { status: request.status, action },
        });
        updateStatus(id, res.data.status);
        markInSession(id);

        // Si quien hizo el cambio es el prestador, el aviso que dijo el servidor es para el cliente.
        if (request.provider_id === userId) {
          addNotice({ userId: request.client_id, requestId: id, type: res.data.notification_type });
        }
      } catch {
        // No se pudo hacer el cambio.
      }
    },
    [updateStatus, markInSession, addNotice, userId],
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
    requestsRef.current = [request, ...requestsRef.current];
    markInSession(request.id);
    setLastCreatedId(request.id);
    setDraft(null);
    setQuote(null);

    // Al prestador le llega el aviso de solicitud nueva cuando entre.
    addNotice({ userId: quote.provider_id, requestId: request.id, type: "incoming_services" });

    return request;
  }, [draft, userId, quote, markInSession, addNotice]);

  // Oculta una solicitud de la pestaña Servicios, solo para este usuario.
  const closeRequest = useCallback(
    (id: string) => {
      if (!userId) return;
      const key = `${userId}-${id}`;
      setClosedIds((prev) => (prev.includes(key) ? prev : [...prev, key]));
    },
    [userId],
  );

  // Acciones del prestador (finalizar también lo puede hacer el cliente).
  const acceptRequest = useCallback((id: string) => changeStatus(id, "accept"), [changeStatus]);
  const rejectRequest = useCallback((id: string) => changeStatus(id, "reject"), [changeStatus]);
  const finishRequest = useCallback((id: string) => changeStatus(id, "finish"), [changeStatus]);

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

  // Pide al servidor los avisos de "solicitud nueva" que ya existían (data.mock) y los muestra una vez.
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
            // Si ya se aceptó o rechazó, el aviso ya no tiene sentido.
            if (!request || request.status !== "pending") return;
            showNotice(request, notification.type);
          }, NOTICE_DELAY);
        });
      })
      .catch(() => {
        // Si fallan los avisos la app sigue funcionando.
      });

    return () => {
      cancelled = true;
    };
  }, [userId, schedule, showNotice]);

  const value: RequestsContextValue = {requests,loading,error,getRequest,currentRequest,getRole,draft,saveDraft,quote,quoteLoading,quoteError,createRequest,lastCreatedId,acceptRequest,rejectRequest,finishRequest,closeRequest,getRating,getUserRating,addRating,};

  return <RequestsContext.Provider value={value}>{children}</RequestsContext.Provider>;};

export const useRequests = () => {
  const context = useContext(RequestsContext);

  if (!context) {
    throw new Error("useRequests must be used within a RequestsProvider");
  }
  return context;
};

