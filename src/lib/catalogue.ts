import { useEffect, useState } from "react";
import { sb } from "./supabase";
import type { Catalogue } from "./pricing";

let cache: Promise<Catalogue> | null = null;
let loadedAt = 0;
const STALE_MS = 2 * 60 * 1000;
const subs = new Set<(c: Catalogue) => void>();

export function loadCatalogue(fresh = false): Promise<Catalogue> {
  if (cache && !fresh && Date.now() - loadedAt < STALE_MS) return cache;
  loadedAt = Date.now();
  cache = (async () => {
    const [s, p, e, g, z, st, ro, rg, sr] = await Promise.all([
      sb.from("services").select("*").eq("active", true).order("sort"),
      sb.from("packages").select("*").eq("active", true).order("sort"),
      sb.from("extras").select("*").eq("active", true).order("sort"),
      sb.from("gear").select("*").eq("active", true).order("sort"),
      sb.from("zones").select("*").order("sort"),
      sb.from("settings").select("key,value"),
      sb.from("role_rates").select("*").eq("active", true).order("sort"),
      sb.from("role_groups").select("*").order("sort"),
      sb.from("service_roles").select("*").order("sort"),
    ]);
    const err = s.error || p.error || e.error || g.error || z.error || ro.error || rg.error || sr.error;
    if (err) throw err;
    const settings: Record<string, string> = {};
    for (const r of st.data ?? []) settings[r.key] = r.value;
    return { services: s.data ?? [], packages: p.data ?? [], extras: e.data ?? [], gear: g.data ?? [], zones: z.data ?? [], settings, roles: ro.data ?? [], roleGroups: rg.data ?? [], serviceRoles: sr.data ?? [] } as Catalogue;
  })();
  cache.catch(() => { cache = null; });
  cache.then((c) => subs.forEach((f) => f(c)), () => {});
  return cache;
}

// A tab left open shows today's prices: reload the catalogue when the person comes back to it.
if (typeof document !== "undefined") document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && cache && Date.now() - loadedAt >= STALE_MS) loadCatalogue(true);
});

export function useCatalogue() {
  const [cat, setCat] = useState<Catalogue | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    subs.add(setCat);
    loadCatalogue().then(setCat, () => setError("We couldn't load prices. Check your connection and try again."));
    return () => { subs.delete(setCat); };
  }, []);
  return { cat, error };
}
