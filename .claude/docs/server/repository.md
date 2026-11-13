# Repository

Only layer with SQL. Parameterized queries, typed rows. TrueK's repositories export **one object per feature** (`usersRepository`, `postsRepository`, ...) whose methods are short verbs — follow this, not individually-exported functions.

```ts
import { pool } from '../../db/pool';
import type { CreateMessageDTO, Message } from './messages.types';

const SELECT_COLUMNS = 'id, service_request_id, user_id as sender_id, message as content, created_at';

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

  create: async (message: CreateMessageDTO): Promise<Message> => {
    const { rows } = await pool.query(
      `insert into chat_messages (service_request_id, user_id, message)
       values ($1, $2, $3)
       returning ${SELECT_COLUMNS}`,
      [message.service_request_id, message.sender_id, message.content],
    );
    return rows[0];
  },

  delete: async (id: string): Promise<boolean> => {
    const { rowCount } = await pool.query('delete from chat_messages where id = $1', [id]);
    return (rowCount ?? 0) > 0;
  },
};
```

Note the column aliasing: the `chat_messages` table has `user_id`/`message`, but the `Message` type (shared with the client) uses `sender_id`/`content` — `SELECT_COLUMNS` bridges that with `AS` instead of renaming the database columns or the type. This is the existing pattern (see `messages.repository.ts`), reuse it rather than inventing a different camelCase-mapping style for a new feature.

## Rules

- `${CONSTANT}` interpolation is only for column lists you wrote; **values always go in `$n` params**.
- Single-row reads return `T | undefined` (`result.rows[0]`); the service decides what a miss means.
- `delete` returns `boolean` (`rowCount > 0`).
- Dynamic `ORDER BY` or table names: map from an allow-list object, never from raw input.
- Optional values: `value ?? null`.
- User/ownership-scoped reads: either filter by the owning column directly in SQL (`WHERE client_id = $1 OR provider_id = $1`), or return the row and let the service compare — pick whichever the feature already does for consistency (`requests`/`messages`/`notifications` currently fetch by primary key and let the caller check; follow that unless a feature specifically needs the SQL-side filter for a list endpoint).

## Nested objects / arrays (rubric requirement)

Use `json_agg(...) filter (where ... is not null)` (or `json_build_object` for a single nested object) instead of a second round-trip or an N+1 loop. TrueK already does this for `posts.tags`:

```ts
const POST_SELECT = `
  select
    p.id, p.user_id, p.name, p.description, p.offer, p.location,
    p.latitude, p.longitude, p.post_image, p.price, p.created_at,
    coalesce(json_agg(t.name) filter (where t.name is not null), '[]') as tags
  from posts p
  left join post_tags pt on pt.post_id = p.id
  left join tags t on t.id = pt.tag_id
`;

// findAll: `${POST_SELECT} group by p.id order by p.created_at desc`
// findById: `${POST_SELECT} where p.id = $1 group by p.id`
```

For a single nested object (not an array), use `json_build_object('id', u.id, 'name', u.name, ...)` instead of `json_agg`. Copy this pattern whenever a new feature needs to return a parent row with a related list or object embedded — this is an explicit Delivery 3 rubric line item, and so far only `posts` does it.

## Transactions

```ts
export const withTransaction = async <T>(fn: (client: PoolClient) => Promise<T>): Promise<T> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
```
