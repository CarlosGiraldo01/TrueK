---
name: add-file-upload
description: Adds file uploads end to end — multer on the server storing in Supabase Storage, and a client hook that validates, compresses and uploads. Use for images attached to posts/profiles instead of the current mock image paths.
argument-hint: "<file kind and limits>"
disable-model-invocation: true
---

# Add file uploads

Argument: the file kind and limits (for example `post images png/jpeg/webp up to 5 MB`).

1. Read `.claude/docs/server/file-upload.md` (multer config, Supabase bucket init, per-user paths, URL ownership check — this is the first server use of `@supabase/supabase-js`) and `.claude/docs/client/file-upload.md` (the `useImageUpload` hook, FormData rules).
2. Server:
   - Add `@supabase/supabase-js`, `multer`, `@types/multer`. Add `src/config/supabase.ts` (service-role key) if `/add-realtime` hasn't already created it.
   - Add the bucket name to `src/config/index.ts` and `server/.env.example`.
   - Create `features/uploads/` with the usual layers (router, controller, service — object-style per `.claude/rules/server-layers.md`), mounted at `/uploads` (no `/api` prefix).
   - Authenticate **before** multer — requires `authMiddleware` to exist (`/add-auth`, if it hasn't run yet, needs to be confirmed with the user first). Allow-list MIME types and set `limits.fileSize`.
   - Store at `<userId>/<uuid>.<ext>`; create the bucket idempotently at startup (`initStorage`, called from `index.ts`).
   - If a stored URL is later sent back by clients, validate it with `isUserImageUrl(url, userId)`.
3. Client:
   - Add `hooks/useImageUpload.ts` (create `client/src/hooks/` if it doesn't exist yet) returning `{ imageUrl, previewUrl, isUploading, error, selectFile, clear }`.
   - Do not set `Content-Type` manually for `FormData`; revoke object URLs on cleanup.
4. Tests: server rejects wrong MIME type (415), oversize file, missing file (400) and anonymous requests (401); client hook rejects invalid type/size before any request.
5. Run `npm run typecheck`, `npm run lint`, `npm test` in both workspaces.
