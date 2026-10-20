"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "./SessionContext";
import { useNotifications } from "./NotificationsContext";
import {RATINGS ,SERVICE_REQUESTS,getPostById,getUserById, type Rating,type ServiceRequest, type ServiceStatus,} from "@/lib/mock";

function getHourlyRate(postId: string): number {
  const post = getPostById(postId) as unknown as Record<string, unknown> | undefined;
  const rate = post?.hourly_rate ?? post?.price_per_hour ?? post?.hourlyRate ?? post?.price;
  return typeof rate === "number" ? rate : 0;
}

// Simulated delays (ms). Everything happens in memory, there is no server yet.
const PROVIDER_RESPONSE_DELAY = 6000;
const PROVIDER_FINISH_DELAY = 12000;
const CLIENT_RATING_DELAY = 4000;
const INCOMING_REQUEST_DELAY = 2500;

// Data filled in "Agendar Servicio" and shown in "Confirmar servicio".
export interface ScheduleDraft {
  post_id: string;
  client_name: string;
  meeting_address: string;
  hours: number;
  date: string; // "2026-11-14"
  time: string; // "16:00"
  request_image: string | null;
}

export type RequestRole = "client" | "provider";

interface RequestsContextValue {
  requests: ServiceRequest[];
  getRequest: (id: string) => ServiceRequest | undefined;
  // The request shown in the Services tab for the logged user (it is ONE, not a list).
  currentRequest: ServiceRequest | undefined;
  getRole: (request: ServiceRequest) => RequestRole | null;

  draft: ScheduleDraft | null;
  saveDraft: (draft: ScheduleDraft) => void;
  createRequest: () => ServiceRequest | null;
  lastCreatedId: string | null;

  acceptRequest: (id: string) => void;
  rejectRequest: (id: string) => void;
  finishRequest: (id: string) => void;
  // Hides the request from the Services tab (it is still reachable by its id).
  closeRequest: (id: string) => void;

  getRating: (requestId: string) => Rating | undefined;
  addRating: (requestId: string, rating: Rating["rating"], comment: string) => void;

  // Simulations: they return a cleanup function, so they can be used directly in a useEffect.
  simulateProviderFinish: (id: string) => () => void;
  simulateClientRating: (id: string) => () => void;
}

const RequestsContext = createContext<RequestsContextValue | null>(null);

// Order used to pick the current request when the user has several open ones.
const STATUS_PRIORITY: Record<ServiceStatus, number> = {
  active: 0,
  accepted: 1,
  pending: 2,
  finished: 3,
  rejected: 4,
  cancelled: 5,
};

function getProviderId(request: ServiceRequest) {
  return getPostById(request.post_id)?.user_id;
}

export const RequestsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useSession();
  const { showNotification } = useNotifications();

  const [requests, setRequests] = useState<ServiceRequest[]>(() => [...SERVICE_REQUESTS]);
  const [ratings, setRatings] = useState<Rating[]>(() => [...RATINGS]);
  const [closedIds, setClosedIds] = useState<string[]>([]);
  const [createdIds, setCreatedIds] = useState<string[]>([]);
  const [draft, setDraft] = useState<ScheduleDraft | null>(null);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);

  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const notifiedIncoming = useRef(new Set<string>());

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  // setTimeout that is cleared if the app is closed. Returns a function to cancel it.
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

  const getRole = useCallback(
    (request: ServiceRequest): RequestRole | null => {
      if (!user) return null;
      if (request.client_id === user.id) return "client";
      if (getProviderId(request) === user.id) return "provider";
      return null;
    },
    [user],
  );

  const currentRequest = useMemo(() => {
    if (!user) return undefined;
    const candidates = requests.filter((request) => {
      if (closedIds.includes(request.id) || request.status === "cancelled") return false;
      // Finished and paid requests from the mock are history, not the current service.
      if (request.status === "finished" && request.payment_confirmed) return false;
      if (request.client_id === user.id) return true;
      // The provider doesn't keep rejected requests: they go back to the empty state.
      return getProviderId(request) === user.id && request.status !== "rejected";
    });
    // Once the user has requested something in this session, only those requests count
    // (the newest wins), so the old mock data doesn't come back after finishing the flow.
    const madeHere = requests.some((r) => createdIds.includes(r.id) && r.client_id === user.id);
    if (madeHere) return candidates.find((r) => createdIds.includes(r.id));
    return [...candidates].sort((a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status])[0];
  }, [requests, closedIds, createdIds, user]);

  const updateStatus = useCallback((id: string, status: ServiceStatus) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }, []);

  // Builds the notification data of the other person of the request.
  const notifyAbout = useCallback(
    (request: ServiceRequest, type: "request_accepted" | "request_rejected" | "services_finished") => {
      const providerId = getProviderId(request);
      const provider = providerId ? getUserById(providerId) : undefined;
      showNotification({
        type,
        name: provider?.name ?? "Prestador",
        avatarUrl: provider?.profile_picture ?? undefined,
        href: type === "services_finished" ? `/requests/${request.id}/rating` : `/requests/${request.id}`,
      });
    },
    [showNotification],
  );

  const saveDraft = useCallback((newDraft: ScheduleDraft) => setDraft(newDraft), []);

  const createRequest = useCallback(() => {
    if (!draft || !user) return null;
    const pricePerHour = getHourlyRate(draft.post_id);
    const request: ServiceRequest = {
      id: `r${Date.now()}`,
      post_id: draft.post_id,
      client_id: user.id,
      meeting_address: draft.meeting_address,
      meeting_date: `${draft.date}T${draft.time}`,
      hours: draft.hours,
      status: "pending",
      request_image: draft.request_image,
      payment_confirmed: false,
      price: pricePerHour * draft.hours,
    };
    // Also added to the shared mock so the screens of the others (chat, payment) can find it by id.
    SERVICE_REQUESTS.push(request);
    setRequests((prev) => [request, ...prev]);
    setCreatedIds((prev) => [request.id, ...prev]);
    setLastCreatedId(request.id);
    setDraft(null);

    // Simulation: after a few seconds the provider accepts the request.
    schedule(() => {
      updateStatus(request.id, "accepted");
      notifyAbout(request, "request_accepted");
    }, PROVIDER_RESPONSE_DELAY);

    return request;
  }, [draft, user, schedule, updateStatus, notifyAbout]);

  const acceptRequest = useCallback((id: string) => updateStatus(id, "active"), [updateStatus]);
  const rejectRequest = useCallback((id: string) => updateStatus(id, "rejected"), [updateStatus]);
  const finishRequest = useCallback((id: string) => updateStatus(id, "finished"), [updateStatus]);

  const closeRequest = useCallback((id: string) => {
    setClosedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const getRating = useCallback(
    (requestId: string) => ratings.find((r) => r.service_request_id === requestId),
    [ratings],
  );

  const addRating = useCallback((requestId: string, rating: Rating["rating"], comment: string) => {
    const request = SERVICE_REQUESTS.find((r) => r.id === requestId);
    const providerId = request ? getProviderId(request) : undefined;
    setRatings((prev) => [
      ...prev.filter((r) => r.service_request_id !== requestId),
      { id: `g${Date.now()}`, service_request_id: requestId, rated_user_id: providerId ?? "", rating, comment },
    ]);
  }, []);

  const simulateProviderFinish = useCallback(
    (id: string) =>
      schedule(() => {
        const request = SERVICE_REQUESTS.find((r) => r.id === id);
        if (!request) return;
        updateStatus(id, "finished");
        notifyAbout(request, "services_finished");
      }, PROVIDER_FINISH_DELAY),
    [schedule, updateStatus, notifyAbout],
  );

  const simulateClientRating = useCallback(
    (id: string) =>
      schedule(() => {
        setRatings((prev) => {
          if (prev.some((r) => r.service_request_id === id)) return prev;
          const request = SERVICE_REQUESTS.find((r) => r.id === id);
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
    [schedule],
  );

  // Simulation for the provider: when someone has requested their service, the notification appears.
  useEffect(() => {
    if (!user) return;
    const incoming = requests.find(
      (r) => r.status === "pending" && getProviderId(r) === user.id && !notifiedIncoming.current.has(r.id),
    );
    if (!incoming) return;

    return schedule(() => {
      notifiedIncoming.current.add(incoming.id);
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
  }, [user, requests, schedule, showNotification]);

  const value: RequestsContextValue = {requests,getRequest,currentRequest,getRole,draft,saveDraft,createRequest,lastCreatedId,acceptRequest,rejectRequest,finishRequest,closeRequest,getRating,addRating,simulateProviderFinish,simulateClientRating,
  };

  return <RequestsContext.Provider value={value}>{children}</RequestsContext.Provider>;
};

export const useRequests = () => {
  const context = useContext(RequestsContext);

  if (!context) {
    throw new Error("useRequests must be used within a RequestsProvider");
  }
  return context;
};
