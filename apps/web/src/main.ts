import { loadBrowserEnv } from "./env.js";
import { mountCastaliaApp } from "./runtime.js";
import "./styles.css";
import "./docs.css";
import "./rfcs.css";
import "./rfc-catalog.css";
import "./rfc-document.css";
import "./spaces.css";

loadBrowserEnv(import.meta.env);
const root = document.getElementById("root");
if (!root) throw new Error("Missing root element");
mountCastaliaApp(root);
