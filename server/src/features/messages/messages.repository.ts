import { pool } from "../../db/pool";
import type { Message } from "./messages.types";

const SELECT_COLUMNS = `id, service_request_id, user_id as sender_id, message as content, created_at`;

export const messagesRepository = {
  findAll: async (requestId?: string): Promise<Message[]> => {
    if (requestId) {
      const { rows } = await pool.query(
        `select ${SELECT_COLUMNS} from chat_messages where service_request_id = $1 order by created_at`,
        [requestId],
      );
      return rows;
    }

    const { rows } = await pool.query(`select ${SELECT_COLUMNS} from chat_messages order by created_at`);
    return rows;
  },

  findById: async (id: string): Promise<Message | undefined> => {
    const { rows } = await pool.query(`select ${SELECT_COLUMNS} from chat_messages where id = $1`, [id]);
    return rows[0];
  },
};