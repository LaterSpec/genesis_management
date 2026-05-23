import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient as createBrowserSupabaseClient } from "@/utils/supabase/client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let serverClient: SupabaseClient | undefined;

function getServerClient() {
  if (!serverClient) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    serverClient = createSupabaseJsClient(supabaseUrl, supabaseAnonKey) as any;
  }
  return serverClient;
}

function getClient() {
  if (typeof window !== "undefined") {
    return createBrowserSupabaseClient();
  }
  return getServerClient();
}

/**
 * Acceso lazy a Supabase: en servidor usa supabase-js; en navegador delega al singleton SSR.
 * Evita dos GoTrueClient cuando lib/api se importa desde componentes "use client".
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client as any, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
