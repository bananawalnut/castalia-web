import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { Layout } from "../src/Layout.js";
import { Communities, Forum, NotFound } from "../src/pages.js";
import { RfcArchitectureDocs } from "../src/rfcArchitectureDocs.js";
afterEach(cleanup);
function at(path: string) {
  return render(
    <RouterProvider
      router={createMemoryRouter(
        [
          {
            element: <Layout />,
            children: [
              { path: "/", element: <Communities /> },
              { path: "/community/:slug/forum", element: <Forum /> },
              {
                path: "/docs/architecture/rfc-exchange",
                element: <RfcArchitectureDocs />,
              },
              { path: "*", element: <NotFound /> },
            ],
          },
        ],
        { initialEntries: [path] },
      )}
    />,
  );
}
describe("route shell", () => {
  it("renders exact unavailable Zenith forum without controls", () => {
    at("/community/zenith/forum");
    expect(
      screen.getByRole("heading", { level: 1, name: "Zenith forum" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Forum unavailable")).toBeInTheDocument();
    expect(
      screen.getByText(/No Matrix connection was attempted/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to communities" }),
    ).toHaveAttribute("href", "/");
    expect(
      screen.getByRole("link", { name: "Read the documentation" }),
    ).toHaveAttribute("href", "/docs");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
  it("renders unknown community without lookup", () => {
    at("/community/other/forum");
    expect(
      screen.getByRole("heading", { name: "Community unavailable" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No Matrix or registry lookup occurred/),
    ).toBeInTheDocument();
  });
  it("has canonical accessible navigation", () => {
    at("/");
    expect(
      screen.getByRole("navigation", { name: "Primary" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByText("Skip to content")).toBeInTheDocument();
  });
  it("renders the RFC exchange architecture as read-only documentation", () => {
    at("/docs/architecture/rfc-exchange");
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "RFC exchange architecture",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Design documentation only")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Authority boundaries" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/WMT output is evidence/)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
