import Boom from "@hapi/boom";
import { pool } from "../../db/pool";
import type { CreateRatingData, Rating } from "./ratings.types";

const SELECT_COLUMNS = `id, service_request_id, rated_user_id, rating, comment`;
const UNIQUE_CONSTRAINT = "ratings_request_rated_user_unique";

// Estrecha un error desconocido a violación de unicidad de pg sobre nuestra constraint.
const isDuplicateRatingError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === "23505" &&
  "constraint" in error &&
  error.constraint === UNIQUE_CONSTRAINT;

export const ratingsRepository = {
  findAll: async (): Promise<Rating[]> => {
    const { rows } = await pool.query(`select ${SELECT_COLUMNS} from ratings order by created_at desc`);
    return rows;
  },

  findById: async (id: string): Promise<Rating | undefined> => {
    const { rows } = await pool.query(`select ${SELECT_COLUMNS} from ratings where id = $1`, [id]);
    return rows[0];
  },

  findByRequestAndRatedUser: async (
    requestId: string,
    ratedUserId: string
  ): Promise<Rating | undefined> => {
    const { rows } = await pool.query(
      `select ${SELECT_COLUMNS} from ratings where service_request_id = $1 and rated_user_id = $2`,
      [requestId, ratedUserId]
    );
    return rows[0];
  },

  create: async (data: CreateRatingData): Promise<Rating> => {
    try {
      const { rows } = await pool.query(
        `insert into ratings (service_request_id, rated_user_id, rating, comment)
         values ($1, $2, $3, $4)
         returning ${SELECT_COLUMNS}`,
        [data.service_request_id, data.rated_user_id, data.rating, data.comment]
      );
      return rows[0];
    } catch (error) {
      // Cubre la carrera entre el pre-chequeo del service y el insert.
      if (isDuplicateRatingError(error)) {
        throw Boom.conflict("Ya calificaste este servicio");
      }
      throw error;
    }
  },
};
