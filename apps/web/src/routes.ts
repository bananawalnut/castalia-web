export const routes = [
  { path: "/", label: "Communities" },
  { path: "/community/:slug/forum", label: "Zenith forum" },
  { path: "/create", label: "Create community" },
  { path: "/create/:requestId", label: "Community request" },
  { path: "/docs", label: "Docs" },
  { path: "/docs/api", label: "API reference" },
  { path: "/docs/specs", label: "Contract specifications" },
  {
    path: "/docs/architecture/rfc-exchange",
    label: "RFC exchange architecture",
  },
] as const;

export const navigation = [
  { to: "/", label: "Communities" },
  { to: "/community/zenith/forum", label: "Zenith forum" },
  { to: "/create", label: "Create community" },
  { to: "/docs", label: "Docs" },
] as const;
