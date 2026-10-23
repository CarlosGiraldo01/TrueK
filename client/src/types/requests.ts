export type ServiceStatus =

  | "pending"
  | "accepted"
  | "rejected"
  | "active"
  | "finished"
  | "cancelled";

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