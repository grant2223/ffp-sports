import { Nav, Footer } from "../web/Layout";
import { useEffect, useRef } from "react";
import { interceptLinks } from "../lib/router";

// The approved page designs, exported as HTML. This wires up their few behaviours: the menu,
// the livestream player rail, the talent filters, and in-app links.
export function wire(root: HTMLElement) {
  const onClick = (e: Event) => {
    const t = (e.target as HTMLElement).closest("[data-act]") as HTMLElement | null;
    if (!t) return;
    const act = t.dataset.act;
    if (act === "menu-open" || act === "menu-close") {
      root.querySelectorAll<HTMLElement>("[data-menu]").forEach((m) => (m.hidden = act === "menu-close"));
      document.documentElement.style.overflow = act === "menu-open" ? "hidden" : "";
    }
    if (act === "feat") {
      const box = root.querySelector<HTMLElement>("[data-vids]");
      const vids = box ? JSON.parse(box.dataset.vids || "[]") : [];
      const v = vids[Number(t.dataset.i)]; if (!v) return;
      const player = root.querySelector<HTMLAnchorElement>("a.player");
      if (player) { player.href = "https://www.youtube.com/watch?v=" + v.id; player.setAttribute("aria-label", "Play " + v.title); const im = player.querySelector("img"); if (im) { im.src = v.img; im.alt = v.title; } }
      const cap = root.querySelector(".pcap"); if (cap) { const b = cap.querySelector("b"), s = cap.querySelectorAll("span"); if (b) b.textContent = v.title; if (s[1]) s[1].textContent = v.client; }
      root.querySelectorAll(".rit").forEach((x, i) => x.classList.toggle("on", i === Number(t.dataset.i)));
    }
  };
  const onChange = (e: Event) => {
    const t = e.target as HTMLSelectElement;
    if (!t.dataset.filter) return;
    const f: Record<string, string> = {};
    root.querySelectorAll<HTMLSelectElement>("[data-filter]").forEach((s) => (f[s.dataset.filter!] = s.value));
    let shown = 0;
    root.querySelectorAll<HTMLElement>(".tcard").forEach((c) => {
      const okk = Object.entries(f).every(([k, v]) => !v || (c.dataset[k] || "").split(",").includes(v));
      c.style.display = okk ? "" : "none"; if (okk) shown++;
    });
    root.querySelectorAll<HTMLElement>("[data-none]").forEach((n) => (n.hidden = shown > 0));
  };
  root.addEventListener("click", onClick);
  root.addEventListener("change", onChange);
  return () => { root.removeEventListener("click", onClick); root.removeEventListener("change", onChange); document.documentElement.style.overflow = ""; };
}

export function StaticPage({ html, cls }: { html: string; cls?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => (ref.current ? wire(ref.current) : undefined), [html]);
  return <div ref={ref} className={cls} onClick={interceptLinks} dangerouslySetInnerHTML={{ __html: html }} />;
}

// Header, menu and footer for the app pages (booking, estimate, legal).
export function Shell({ children, cls = "pg-book", footer = true }: { children: React.ReactNode; cls?: string; footer?: boolean }) {
  return (
    <div className="fs">
      <Nav />
      <div className={cls} onClick={interceptLinks} style={{ fontFamily: "Montserrat, Arial, sans-serif", color: "#0f1720", background: "#ffffff", WebkitFontSmoothing: "antialiased", minHeight: "70vh" }}>{children}</div>
      {footer && <Footer />}
    </div>
  );
}
