import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "@fontsource/montserrat/latin-400.css";
import "@fontsource/montserrat/latin-500.css";
import "@fontsource/montserrat/latin-600.css";
import "@fontsource/montserrat/latin-700.css";
import "@fontsource/montserrat/latin-800.css";
import "@fontsource/montserrat/latin-800-italic.css";
import "./site/base.css";
import "./site/home.css";
import "./site/book.css";
import "./web/web.css";
import { loadCatalogue } from "./lib/catalogue";

// start fetching live prices at once, so service pages show them as they open
if (!location.pathname.startsWith("/admin")) loadCatalogue().catch(() => {});

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
