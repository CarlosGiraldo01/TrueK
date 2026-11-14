import { pool } from "../../db/pool";
import type { UpdateUserInput, User } from "./users.types";

// Lista fija campo -> columna: las claves del input nunca se interpolan en el SQL.
const UPDATABLE_COLUMNS: ReadonlyArray<readonly [keyof UpdateUserInput, string]> = [
  ["name", "name"],
  ["description", "description"],
  ["profile_picture", "profile_picture"],
  ["age", "age"],
  ["location", "location"],
  ["latitude", "latitude"],
  ["longitude", "longitude"],
];

const SELECT_COLUMNS = `id, name, email, profile_picture, age, location, description, role, latitude, longitude`;

export const usersRepository = {
  findAll: async (): Promise<User[]> => {
    const { rows } = await pool.query(`select ${SELECT_COLUMNS} from users order by created_at`);
    return rows;
  },

  findById: async (id: string): Promise<User | undefined> => {
    const { rows } = await pool.query(`select ${SELECT_COLUMNS} from users where id = $1`, [id]);
    return rows[0];
  },

  update: async (id: string, patch: UpdateUserInput): Promise<User | undefined> => {
    const sets: string[] = [];
    const values: unknown[] = [];
    for (const [field, column] of UPDATABLE_COLUMNS) {
      if (patch[field] !== undefined) {
        values.push(patch[field]);
        sets.push(`${column} = $${values.length}`);
      }
    }
    values.push(id);
    const { rows } = await pool.query(
      `update users set ${sets.join(", ")} where id = $${values.length} returning ${SELECT_COLUMNS}`,
      values,
    );
    return rows[0];
  },
};
