import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { Layout } from "../src/Layout.js";
import { Communities, Forum, NotFound } from "../src/pages.js";
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
});
