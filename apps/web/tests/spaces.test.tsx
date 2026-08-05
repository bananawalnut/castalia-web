import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { NewRoom, NewSpace, Spaces, SpaceViewer } from "../src/Spaces.js";

afterEach(cleanup);

function renderRoute(
  path: string,
  routePath: string,
  element: React.ReactNode,
) {
  return render(
    <RouterProvider
      router={createMemoryRouter([{ path: routePath, element }], {
        initialEntries: [path],
      })}
    />,
  );
}

describe("fixture Spaces UI", () => {
  it("indexes spaces and room-oriented creation actions without artifact boards", () => {
    renderRoute("/spaces", "/spaces", <Spaces />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Spaces" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Spaces hold rooms and shared activity/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /create a new space/i }),
    ).toHaveAttribute("href", "/spaces/new");
    expect(screen.queryByRole("link", { name: /create a room/i })).toBeNull();
    expect(screen.getByRole("link", { name: /Zenith/ })).toHaveAttribute(
      "href",
      "/spaces/zenith",
    );
    expect(screen.queryByRole("link", { name: "RFC Board" })).toBeNull();
    expect(screen.queryByText(/Proposal Board/)).toBeNull();
  });

  it("opens a space as a room directory", () => {
    renderRoute("/spaces/zenith", "/spaces/:spaceId", <SpaceViewer />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Zenith" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Rooms" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /The Commons/ })).toHaveAttribute(
      "href",
      "/room/zenith",
    );
    expect(
      screen.getByRole("link", { name: /create a room/i }),
    ).toHaveAttribute("href", "/spaces/zenith/rooms/new");
    expect(screen.queryByText(/RFC Board/)).toBeNull();
  });

  it("keeps create-space unavailable and accepts no input", () => {
    renderRoute("/spaces/new", "/spaces/new", <NewSpace />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Create a new space" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Space creation is unavailable/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("keeps room creation inside a Space and accepts no input", () => {
    renderRoute(
      "/spaces/zenith/rooms/new",
      "/spaces/:spaceId/rooms/new",
      <NewRoom />,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Create a room" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Room creation is unavailable/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });
});
