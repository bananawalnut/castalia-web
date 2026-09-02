import { loadBrowserEnv } from "./env.js";
import { mountCastaliaApp } from "./runtime.js";
import "./styles.css";
import "./chronicle.css";
import "./docs.css";
import "./rfcs.css";
import "./rfc-catalog.css";
import "./rfc-document.css";
import "./spaces.css";
import "./start.css";

const env = loadBrowserEnv(import.meta.env);
const root = document.getElementById("root");
if (!root) throw new Error("Missing root element");
mountCastaliaApp(root, {
  walletInstallUrl: env.walletInstallUrl,
});
