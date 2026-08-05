export const routes = [
  { path: "/", label: "Landing" },
  { path: "/tenders", label: "Tenders" },
  { path: "/rfcs", label: "RFCs" },
  { path: "/docs", label: "Docs" },
] as const;

export const navigation = [
  { to: "/chronicle", label: "Chronicle" },
  { to: "/tenders", label: "Tenders" },
  { to: "/rfcs", label: "RFC" },
  { to: "/merch", label: "Merch" },
  { to: "/docs", label: "Docs" },
] as const;
