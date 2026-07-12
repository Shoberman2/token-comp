import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "./env";
import type { Database } from "./types";

export { isSupabaseConfigured };
export type ServerSupabaseClient = SupabaseClient<Database>;

function bearerToken(request?: Request) {
  const authorization = request?.headers.get("authorization")?.trim() ?? "";
  return authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : "";
}

export function createPublicSupabaseClient(): ServerSupabaseClient | null {
  if (!supabaseUrl || !supabasePublishableKey) return null;

  return createClient<Database>(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export async function createServerSupabaseClient(request?: Request): Promise<ServerSupabaseClient | null> {
  if (!supabaseUrl || !supabasePublishableKey) return null;

  const token = bearerToken(request);
  if (token) {
    return createClient<Database>(supabaseUrl, supabasePublishableKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies. Route handlers and proxy can.
        }
      },
    },
  });
}

export async function getCurrentSupabaseUser(request?: Request) {
  const supabase = await createServerSupabaseClient(request);
  if (!supabase) return null;

  const token = bearerToken(request);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token || undefined);

  if (error || !user) return null;
  return user;
}

export async function getAuthenticatedRequest(
  request: Request
): Promise<{ supabase: ServerSupabaseClient | null; user: User | null }> {
  const supabase = await createServerSupabaseClient(request);
  if (!supabase) return { supabase: null, user: null };

  const token = bearerToken(request);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token || undefined);

  return { supabase, user: error ? null : user };
}
