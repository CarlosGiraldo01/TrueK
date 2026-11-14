export interface Message {
  id: string;
  service_request_id: string;
  sender_id: string;
  content: string;
  created_at: string;  
}

export interface CreateMessageInput {
  sender_id: string;
  service_request_id: string;
  content: string;
}
