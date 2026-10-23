export interface Rating {
  id: string;
  service_request_id: string;
  rated_user_id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;   
}