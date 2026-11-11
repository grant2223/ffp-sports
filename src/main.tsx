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

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
