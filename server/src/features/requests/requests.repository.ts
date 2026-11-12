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
};