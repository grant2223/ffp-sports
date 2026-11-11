// Plain line icons, drawn here so nothing extra loads.
type P = { c?: string; s?: number };
const svg = (d: React.ReactNode, { c = "currentColor", s = 22 }: P) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
export const I = {
  arrow: (p: P = {}) => svg(<><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>, p),
  check: (p: P = {}) => svg(<path d="m5 12.5 4.2 4.2L19 7" />, p),
  shield: (p: P = {}) => svg(<><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3Z" /><path d="m8.8 12.2 2.3 2.3 4.3-4.6" /></>, p),
  pin: (p: P = {}) => svg(<><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21Z" /><circle cx="12" cy="10" r="2.4" /></>, p),
  play: (p: P = {}) => svg(<path d="M8 5.5v13l11-6.5-11-6.5Z" fill={p.c ?? "currentColor"} />, p),
  menu: (p: P = {}) => svg(<><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>, p),
  close: (p: P = {}) => svg(<><path d="M6 6l12 12" /><path d="M18 6 6 18" /></>, p),
  down: (p: P = {}) => svg(<path d="m6 9 6 6 6-6" />, p),
  people: (p: P = {}) => svg(<><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.6-3.2 2.9-5 5.5-5s4.9 1.8 5.5 5" /><circle cx="17" cy="9" r="2.6" /><path d="M16 14.2c2.4.2 4 1.8 4.5 4.8" /></>, p),
  person: (p: P = {}) => svg(<><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-3.8 3.7-6 7-6s6.2 2.2 7 6" /></>, p),
  cam: (p: P = {}) => svg(<><rect x="3" y="7" width="12.5" height="10" rx="1.5" /><path d="m15.5 11 5-3v8l-5-3" /></>, p),
  mic: (p: P = {}) => svg(<><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0" /><path d="M12 17.5V21" /></>, p),
  clock: (p: P = {}) => svg(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>, p),
  scissors: (p: P = {}) => svg(<><circle cx="6" cy="7" r="2.5" /><circle cx="6" cy="17" r="2.5" /><path d="M8 8.5 20 17" /><path d="M8 15.5 20 7" /></>, p),
  vertical: (p: P = {}) => svg(<><rect x="7" y="3" width="10" height="18" rx="2" /><path d="M11 17.5h2" /></>, p),
  sun: (p: P = {}) => svg(<><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" /></>, p),
  live: (p: P = {}) => svg(<><circle cx="12" cy="12" r="2.2" /><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14" /></>, p),
  tag: (p: P = {}) => svg(<><path d="M3.5 12.5V4.5h8l9 9-8 8-9-9Z" /><circle cx="8" cy="9" r="1.4" /></>, p),
  truck: (p: P = {}) => svg(<><path d="M3 6.5h11v9H3z" /><path d="M14 9.5h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>, p),
  film: (p: P = {}) => svg(<><rect x="3.5" y="4" width="17" height="16" rx="1.5" /><path d="M8 4v16M16 4v16M3.5 9H8M3.5 15H8M16 9h4.5M16 15h4.5" /></>, p),
  calendar: (p: P = {}) => svg(<><rect x="3.5" y="5" width="17" height="15" rx="1.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>, p),
};
export const addonIcon = (k: string) => (I as Record<string, (p?: P) => React.ReactNode>)[k] ?? I.check;
