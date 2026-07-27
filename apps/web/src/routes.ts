export const routes = [
  { path: "/", label: "Rooms" },
  { path: "/room/:slug", label: "Group chat" },
  { path: "/community/:slug/forum", label: "Legacy room redirect" },
  { path: "/create", label: "Create room" },
  { path: "/create/:requestId", label: "Room request" },
  { path: "/docs", label: "Docs" },
  { path: "/docs/api", label: "API reference" },
  { path: "/docs/specs", label: "Contract specifications" },
  {
    path: "/docs/architecture/rfc-exchange",
    label: "RFC exchange architecture",
  },
] as const;

export const navigation = [
  { to: "/", label: "Rooms" },
  { to: "/room/zenith", label: "Zenith" },
  { to: "/create", label: "Create room" },
  { to: "/docs", label: "Docs" },
] as const;
