import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('Falta la variable de entorno DATABASE_URL');
}

const supabaseUrl = process.env.SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error('Falta la variable de entorno SUPABASE_URL');
}

const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  throw new Error('Falta la variable de entorno SUPABASE_SERVICE_KEY');
}

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('Falta la variable de entorno JWT_SECRET');
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:3000',
  databaseUrl,
  supabaseUrl,
  supabaseServiceKey,
  jwtSecret,
  imagesBucket: process.env.IMAGES_BUCKET ?? 'images',
};