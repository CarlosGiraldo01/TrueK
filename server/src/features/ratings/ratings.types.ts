export interface Rating {
  id: string;
  service_request_id: string;
  rated_user_id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string | null;
}

export interface CreateRatingInput {
  rater_id: string;
  service_request_id: string;
  rating: Rating["rating"];
  comment: string | null;
}

export interface CreateRatingData {
  service_request_id: string;
  rated_user_id: string;
  rating: Rating["rating"];
  comment: string | null;
}
