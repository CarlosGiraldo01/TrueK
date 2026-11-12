import { pool } from "../../db/pool";
import type { Notification } from "./notifications.types";

const SELECT_COLUMNS = `id, user_id, service_request_id, type, message`;

export const notificationsRepository = {
  findAll: async (): Promise<Notification[]> => {
    const { rows } = await pool.query(`select ${SELECT_COLUMNS} from notifications order by created_at desc`);
    return rows;
  },

  findById: async (id: string): Promise<Notification | undefined> => {
    const { rows } = await pool.query(`select ${SELECT_COLUMNS} from notifications where id = $1`, [id]);
    return rows[0];
  },

  findByUserId: async (userId: string): Promise<Notification[]> => {
    const { rows } = await pool.query(
      `select ${SELECT_COLUMNS} from notifications where user_id = $1 order by created_at desc`,
      [userId],
    );
    return rows;
  },
};