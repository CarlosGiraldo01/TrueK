# File uploads (multer + Supabase Storage)

Not used yet in TrueK — current post/profile images are static paths under `client/public/mock/` or external Unsplash URLs. This is the pattern for when a feature needs a real upload (e.g. letting a provider upload their own post photo instead of picking a mock one).

Dependencies: `multer`, `@types/multer`, and `@supabase/supabase-js` (not installed yet — this would be its first use on the server; the server currently talks to Postgres directly via `pg`, not through the Supabase JS client).

## Service

```ts
import Boom from '@hapi/boom';
import { randomUUID } from 'node:crypto';
import { config } from '../../config';
import { supabase } from '../../config/supabase';

export const IMAGE_MAX_SIZE_MB = 5;

const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

export const IMAGE_MIME_TYPES = Object.keys(EXTENSIONS);

// Called at startup; idempotent
export const initStorage = async () => {
  const { error } = await supabase.storage.createBucket(config.imagesBucket, {
    public: true,
    fileSizeLimit: `${IMAGE_MAX_SIZE_MB}MB`,
    allowedMimeTypes: IMAGE_MIME_TYPES,
  });

  if (error && !/already exists/i.test(error.message)) {
    throw error;
  }
};

const getUserFolderUrl = (userId: string): string =>
  supabase.storage.from(config.imagesBucket).getPublicUrl(`${userId}/`).data.publicUrl;

export const isUserImageUrl = (url: string, userId: string): boolean =>
  url.startsWith(getUserFolderUrl(userId));

export const uploadsService = {
  uploadImage: async (userId: string, file: Express.Multer.File): Promise<string> => {
    const path = `${userId}/${randomUUID()}.${EXTENSIONS[file.mimetype]}`;

    const { error } = await supabase.storage
      .from(config.imagesBucket)
      .upload(path, file.buffer, { contentType: file.mimetype });

    if (error) {
      throw Boom.badGateway('The image could not be stored', error.message);
    }

    return supabase.storage.from(config.imagesBucket).getPublicUrl(path).data.publicUrl;
  },
};
```

`src/config/supabase.ts` (new file, created once): `createClient(config.supabaseUrl, config.supabaseServiceKey)` using the Supabase **service role** key — not the `anon`/publishable one, and it never leaves the server. Add `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `IMAGES_BUCKET` to `src/config/index.ts` and `server/.env.example`.

## Router

```ts
import Boom from '@hapi/boom';
import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { uploadImage } from './uploads.controller';
import { IMAGE_MAX_SIZE_MB, IMAGE_MIME_TYPES } from './uploads.service';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: IMAGE_MAX_SIZE_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (IMAGE_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(Boom.unsupportedMediaType('Only png, jpeg and webp images are supported'));
  },
});

export const uploadsRouter = Router();

// Authenticate first so anonymous requests never get their body parsed
uploadsRouter.post('/images', authMiddleware, upload.single('file'), uploadImage);
```

## Controller

```ts
export const uploadImage = async (req: Request, res: Response) => {
  const user = getUserFromRequest(req);

  if (!req.file) {
    throw Boom.badRequest('An image is required in the "file" field');
  }

  const url = await uploadsService.uploadImage(user.sub, req.file);
  res.status(201).json({ url });
};
```

## Security notes

- The `fileFilter` trusts the client's MIME type; the bucket's `allowedMimeTypes` is the second line of defense.
- multer errors (`LIMIT_FILE_SIZE`) are not Boom: map them in `errorMiddleware.ts` to `413` if needed.
- A URL later sent back by a client (for example to attach an image to a post) must pass `isUserImageUrl(url, user.sub)` before it is stored or forwarded.
- Mount at `/uploads` (no `/api` prefix).
- Non-image files: same pattern with another bucket, MIME allow-list and size limit; use `public: false` plus `createSignedUrl` when files must not be public.
