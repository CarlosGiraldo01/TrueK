// Valores falsos para que config no lance al importarse; ningún test toca servicios reales.
process.env.DATABASE_URL ??= "postgres://test:test@localhost:5432/test";
process.env.SUPABASE_URL ??= "https://test-project.supabase.co";
process.env.SUPABASE_SERVICE_KEY ??= "test-service-key";
