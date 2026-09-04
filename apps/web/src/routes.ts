import { TOP_LEVEL_PAGE_ROUTES } from "./page-routes.js";

export const routes = TOP_LEVEL_PAGE_ROUTES;

export const navigation = [
  { to: "/chronicle", label: "Chronicle" },
  { to: "/tenders", label: "Tenders" },
  { to: "/rfcs", label: "RFC" },
  { to: "/merch", label: "Merch" },
  { to: "/docs", label: "Docs" },
  { to: "/start", label: "Join" },
] as const;
