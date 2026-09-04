import { ALL_RFC_FIXTURES } from "./rfcFixtures.js";
import { TENDER_FIXTURES } from "./tenderFixtures.js";

export const TOP_LEVEL_PAGE_ROUTES = [
  { path: "/", label: "Landing" },
  { path: "/start", label: "Start" },
  { path: "/my-castalia", label: "My Castalia" },
  { path: "/profile", label: "My Castalia (compatibility route)" },
  { path: "/chronicle", label: "Chronicle" },
  { path: "/tenders", label: "Tenders" },
  { path: "/rfcs", label: "RFCs" },
  { path: "/docs", label: "Docs" },
] as const;

export const PAGE_ROUTES = [
  ...TOP_LEVEL_PAGE_ROUTES.map((route) => route.path),
  ...TENDER_FIXTURES.map(
    (tender) => `/tenders/${tender.id.toLowerCase()}` as const,
  ),
  ...ALL_RFC_FIXTURES.map((rfc) => `/rfcs/${rfc.id.toLowerCase()}` as const),
] as const;
