import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { Layout } from "../src/Layout.js";
import { Rooms, Room, NotFound } from "../src/pages.js";
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
              { path: "/", element: <Rooms /> },
              { path: "/room/:slug", element: <Room /> },
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
  it("renders exact unavailable Zenith room without controls", () => {
    at("/room/zenith");
    expect(
      screen.getByRole("heading", { level: 1, name: "Zenith" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Messages unavailable")).toBeInTheDocument();
    expect(
      screen.getByText(/The live Synapse room adapter is not installed/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to rooms" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.getByRole("link", { name: "Read documentation" }),
    ).toHaveAttribute("href", "/docs");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
  it("renders unknown room without lookup", () => {
    at("/room/other");
    expect(
      screen.getByRole("heading", { name: "Room not found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No fixture matches this room/),
    ).toBeInTheDocument();
  });
  it("has canonical accessible navigation", () => {
    at("/");
    expect(
      screen.getByRole("navigation", { name: "Primary" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByText("Skip to content")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Castalia" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Rooms" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Members unavailable")).not.toBeInTheDocument();
  });
  it("renders RFC exchange architecture within the Castalia docs shell", () => {
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
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
