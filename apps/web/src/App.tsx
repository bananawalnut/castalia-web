import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
  useParams,
} from "react-router";
import { Layout } from "./Layout.js";
import { RfcArchitectureDocs } from "./rfcArchitectureDocs.js";
import { RfcExchangePreview } from "./rfcExchangePreview.js";
import "./rfcExchangeCastalia.css";
import {
  ApiDocs,
  Create,
  Docs,
  NotFound,
  Request,
  Room,
  Rooms,
  Specs,
} from "./pages.js";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Rooms /> },
      { path: "/room/:slug", element: <Room /> },
      { path: "/community/:slug/forum", element: <LegacyRoomRedirect /> },
      { path: "/create", element: <Create /> },
      { path: "/create/:requestId", element: <Request /> },
      { path: "/docs", element: <Docs /> },
      { path: "/docs/api", element: <ApiDocs /> },
      { path: "/docs/specs", element: <Specs /> },
      {
        path: "/docs/architecture/rfc-exchange",
        element: <RfcArchitectureDocs />,
      },
      {
        path: "/docs/rfc-exchange/preview",
        element: <RfcExchangePreview />,
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

function LegacyRoomRedirect() {
  const { slug } = useParams();
  return <Navigate replace to={slug ? `/room/${slug}` : "/"} />;
}

export function App() {
  return <RouterProvider router={router} />;
}
