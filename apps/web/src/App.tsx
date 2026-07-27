import { createBrowserRouter, RouterProvider } from "react-router";
import { Layout } from "./Layout.js";
import { RfcArchitectureDocs } from "./rfcArchitectureDocs.js";
import {
  ApiDocs,
  Communities,
  Create,
  Docs,
  Forum,
  NotFound,
  Request,
  Specs,
} from "./pages.js";

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Communities /> },
      { path: "/community/:slug/forum", element: <Forum /> },
      { path: "/create", element: <Create /> },
      { path: "/create/:requestId", element: <Request /> },
      { path: "/docs", element: <Docs /> },
      { path: "/docs/api", element: <ApiDocs /> },
      { path: "/docs/specs", element: <Specs /> },
      {
        path: "/docs/architecture/rfc-exchange",
        element: <RfcArchitectureDocs />,
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
export function App() {
  return <RouterProvider router={router} />;
}
