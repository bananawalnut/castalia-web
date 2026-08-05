import { createBrowserRouter, RouterProvider } from "react-router";
import { Docs } from "./Docs.js";
import { Layout } from "./Layout.js";
import {
  ProblemViewer,
  Problems,
  ProposalViewer,
  Proposals,
  RfcViewer,
  Rfcs,
} from "./Rfcs.js";
import {
  CommonsRoom,
  NewRoom,
  NewSpace,
  Spaces,
  SpaceViewer,
} from "./Spaces.js";
import { NotFound, Rooms } from "./pages.js";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Rooms /> },
      { path: "/room/zenith", element: <CommonsRoom /> },
      { path: "/spaces", element: <Spaces /> },
      { path: "/spaces/new", element: <NewSpace /> },
      { path: "/spaces/:spaceId/rooms/new", element: <NewRoom /> },
      { path: "/spaces/:spaceId", element: <SpaceViewer /> },
      { path: "/rfcs", element: <Rfcs /> },
      { path: "/rfcs/:rfcId", element: <RfcViewer /> },
      { path: "/problems", element: <Problems /> },
      { path: "/problems/:problemId", element: <ProblemViewer /> },
      { path: "/proposals", element: <Proposals /> },
      { path: "/proposals/:proposalId", element: <ProposalViewer /> },
      { path: "/docs", element: <Docs /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
