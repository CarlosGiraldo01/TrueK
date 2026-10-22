import type { Notification } from "./notifications.types";

export const notificationsMock: Notification[] = [
  {
    id: "n1",
    user_id: "u1",
    service_request_id: "r2",
    type: "request_accepted",
    message: "Ha aceptado tu solicitud",
  },
  {
    id: "n2",
    user_id: "u1",
    service_request_id: "r3",
    type: "services_finished",
    message: "Tu servicio ha terminado!",
  },
  {
    id: "n3",
    user_id: "u2",
    service_request_id: "r1",
    type: "incoming_services",
    message: "Solicita tus servicios de:",
  },
  {
    id: "n4",
    user_id: "u1",
    service_request_id: "r6",
    type: "request_rejected",
    message: "Ha rechazado tu solicitud",
  },
];