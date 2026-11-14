import { pool } from "../../db/pool";
import type { CreatePostData, Post } from "./posts.types";

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

  // Un solo statement con CTE: el post y sus tags se insertan de forma atómica.
  create: async (data: CreatePostData): Promise<string> => {
    const { rows } = await pool.query(
      `with new_post as (
         insert into posts (user_id, name, description, offer, location, latitude, longitude, post_image, price)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         returning id
       ),
       new_tags as (
         insert into post_tags (post_id, tag_id)
         select new_post.id, t.id from new_post
         join tags t on t.name = any($10::text[])
       )
       select id from new_post`,
      [
        data.user_id,
        data.name,
        data.description,
        data.offer,
        data.location,
        data.latitude,
        data.longitude,
        data.post_image ?? null,
        data.price,
        data.tags,
      ]
    );
    return rows[0].id;
  },

  findTags: async (): Promise<string[]> => {
    const { rows } = await pool.query(`select name from tags order by name`);
    return rows.map((row) => row.name);
  },
};