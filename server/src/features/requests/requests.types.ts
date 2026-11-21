import { NotificationType } from "../notifications/notifications.types";

export type ServiceStatus = "pending"|"accepted"|"rejected"|"active"|"finished"|"cancelled";

export interface ServiceRequest {
  id: string;
  post_id: string;
  client_id: string;
  meeting_address: string;
  meeting_date: string;
  hours: number;
  status: ServiceStatus;
  request_image: string | null;
  payment_confirmed: boolean;
  price: number;  
}
export type RequestAction = "accept"|"reject"|"finish";
export interface RequesttWithProvider extends ServiceRequest {
  provider_id: string|null;
}
export interface Quote {
  post_id: string;
  provider_id: string;
  hours: number;
  price_per_hour: number;
  total: number;
}
export interface Transition {
  status: ServiceStatus;
  notification_type: NotificationType;
}

// Lo que viaja por el socket cuando a un usuario le llega un aviso nuevo
export interface RequestNotificationEvent {
  type: NotificationType;
  message: string;
  request: RequesttWithProvider;
}

export interface CreateRequestInput {
  post_id: string;
  meeting_address: string;
  meeting_date: string;
  hours: number;
  request_image?: string | null;
}
