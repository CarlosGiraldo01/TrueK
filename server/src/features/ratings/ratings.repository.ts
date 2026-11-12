import { pool } from "../../db/pool";
import type { Rating } from "./ratings.types";

const SELECT_COLUMNS = `id, service_request_id, rated_user_id, rating, comment`;

export const ratingsRepository = {
  findAll: async (): Promise<Rating[]> => {
    const { rows } = await pool.query(`select ${SELECT_COLUMNS} from ratings order by created_at desc`);
    return rows;
  },

  findById: async (id: string): Promise<Rating | undefined> => {
    const { rows } = await pool.query(`select ${SELECT_COLUMNS} from ratings where id = $1`, [id]);
    return rows[0];
  },
};