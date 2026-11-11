import { useEffect, useState } from "react";

export function go(path: string, replace = false) {
  if (replace) history.replaceState(null, "", path);
  else history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  if (!path.includes("#")) window.scrollTo(0, 0);
}

export function usePath() {
  const [path, setPath] = useState(location.pathname + location.search);
  useEffect(() => {
    const on = () => setPath(location.pathname + location.search);
    window.addEventListener("popstate", on);
    return () => window.removeEventListener("popstate", on);
  }, []);
  return path;
}

// Internal links inside static HTML go through the router, so pages switch without a reload.
export function interceptLinks(e: React.MouseEvent) {
  const a = (e.target as HTMLElement).closest("a");
  if (!a || a.target === "_blank" || e.metaKey || e.ctrlKey) return;
  const href = a.getAttribute("href") || "";
  if (href.startsWith("/") && !href.startsWith("//")) { e.preventDefault(); go(href); }
}
