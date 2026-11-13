import { pool } from "../../db/pool";
import type { ServiceRequest } from "./requests.types";

const SELECT_COLUMNS = `
  id, post_id, client_id, meeting_address, meeting_date, hours, status,
  request_image, payment_confirmed, price
`;

export const requestsRepository = {
  findAll: async (): Promise<ServiceRequest[]> => {
    const { rows } = await pool.query(
      `select ${SELECT_COLUMNS} from service_requests order by created_at desc`
    );
    return rows;
  },

  findById: async (id: string): Promise<ServiceRequest | undefined> => {
    const { rows } = await pool.query(
      `select ${SELECT_COLUMNS} from service_requests where id = $1`,
      [id]
    );
    return rows[0];
  },

  // Crea la solicitud y el aviso "incoming_services" para el prestador en un solo statement (CTE):
  // si el segundo insert falla, Postgres revierte los dos, así nunca queda una solicitud sin aviso.
  // Escribe en notifications desde aquí a propósito: la atomicidad exige una sola query.
  // status y payment_confirmed van fijos en el SQL: nunca vienen del cliente.
  create: async (data: {
    post_id: string;
    client_id: string;
    meeting_address: string;
    meeting_date: string;
    hours: number;
    request_image: string | null;
    price: number;
    provider_id: string;
    notification_message: string;
  }): Promise<ServiceRequest> => {
    const { rows } = await pool.query(
      `with new_request as (
         insert into service_requests
           (post_id, client_id, meeting_address, meeting_date, hours, status, request_image, payment_confirmed, price)
         values ($1, $2, $3, $4, $5, 'pending', $6, false, $7)
         returning ${SELECT_COLUMNS}
       ),
       new_notification as (
         insert into notifications (user_id, service_request_id, type, message)
         select $8, new_request.id, 'incoming_services', $9 from new_request
       )
       select * from new_request`,
      [
        data.post_id,
        data.client_id,
        data.meeting_address,
        data.meeting_date,
        data.hours,
        data.request_image,
        data.price,
        data.provider_id,
        data.notification_message,
      ]
    );
    return rows[0];
  },
};