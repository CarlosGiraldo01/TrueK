import { pool } from "../../db/pool";
import type { Post } from "./posts.types";

const POST_SELECT = `
  select
    p.id,
    p.user_id,
    p.name,
    p.description,
    p.offer,
    p.location,
    p.latitude,
    p.longitude,
    p.post_image,
    p.price,
    p.created_at,
    coalesce(json_agg(t.name) filter (where t.name is not null), '[]') as tags from posts p
    left join post_tags pt on pt.post_id = p.id
    left join tags t on t.id = pt.tag_id
`;

export const postsRepository = {
  findAll: async (): Promise<Post[]> => {
    const { rows } = await pool.query(
      `${POST_SELECT} group by p.id order by p.created_at desc`
    );
    return rows;
  },

  findById: async (id: string): Promise<Post | undefined> => {
    const { rows } = await pool.query(
      `${POST_SELECT} where p.id = $1 group by p.id`,
      [id]
    );
    return rows[0];
  },

  findTags: async (): Promise<string[]> => {
    const { rows } = await pool.query(`select name from tags order by name`);
    return rows.map((row) => row.name);
  },
};