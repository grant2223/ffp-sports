import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://ntqnopvnlnqvhnjkvkxp.supabase.co";
export const SUPABASE_KEY = "sb_publishable_eZwgICTAevkCNBfuu5D45A_5qABC0N_";

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

// Calls the api edge function. Admin actions send the signed-in session.
export async function api<T = Record<string, unknown>>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  const { data: s } = await sb.auth.getSession();
  const r = await fetch(`${SUPABASE_URL}/functions/v1/api`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${s.session?.access_token ?? SUPABASE_KEY}` },
    body: JSON.stringify({ action, ...body }),
  });
  const j = await r.json().catch(() => ({ error: "Something went wrong. Please try again." }));
  if (!r.ok || j.error) throw new Error(j.error || "Something went wrong. Please try again.");
  return j as T;
}
