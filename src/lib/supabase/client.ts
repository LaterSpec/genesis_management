import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Singleton del cliente Supabase (sin tipo genérico Database).
 * Cada módulo de API hace el cast a sus propios tipos fuertemente tipados.
 * Para generar tipos automáticos en producción:
 *   npx supabase gen types typescript --local > src/lib/database.types.ts
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient(supabaseUrl, supabaseAnonKey) as any;
