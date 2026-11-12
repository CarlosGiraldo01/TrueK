import { pool } from "../../db/pool";
import type { User } from "./users.types";

const SELECT_COLUMNS = `id, name, email, profile_picture, age, location, description, role`;

export const usersRepository = {
  findAll: async (): Promise<User[]> => {
    const { rows } = await pool.query(`select ${SELECT_COLUMNS} from users order by created_at`);
    return rows;
  },

  findById: async (id: string): Promise<User | undefined> => {
    const { rows } = await pool.query(`select ${SELECT_COLUMNS} from users where id = $1`, [id]);
    return rows[0];
  },
};