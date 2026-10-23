export type NotificationType =

  | "incoming_services"
  | "services_finished"
  | "request_accepted"
  | "request_rejected";

export interface Notification {
  id: string;
  user_id: string;
  service_request_id: string;
  type: NotificationType;
  message: string;  
}