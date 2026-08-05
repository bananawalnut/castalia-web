import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import {
  ProblemViewer,
  Problems,
  ProposalViewer,
  Proposals,
  RfcViewer,
  Rfcs,
} from "../src/Rfcs.js";

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

describe("fixture artifact boards", () => {
  it("renders the RFC board as a submission list with viewer links", () => {
    renderRoute("/rfcs", "/rfcs", <Rfcs />);

    expect(
      screen.getByRole("heading", { level: 1, name: "RFC Board" }),
    ).toBeInTheDocument();
    expect(screen.getByText("RFC-0017")).toBeInTheDocument();
    expect(screen.getByText("RFC-0024")).toBeInTheDocument();
    expect(screen.getAllByText("Open viewer →")).toHaveLength(2);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(screen.queryByText(/Confirm what Castalia understood/i)).toBeNull();
  });

  it("opens an exact RFC fixture in a viewer", () => {
    renderRoute("/rfcs/rfc-0017", "/rfcs/:rfcId", <RfcViewer />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Proof-carrying bounded search reports",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("rev-rfc-0017-c")).toBeInTheDocument();
    expect(screen.getByText("agent:cedar-07")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "← Back to RFC Board" }),
    ).toHaveAttribute("href", "/rfcs");
  });

  it("keeps the Problem Board limited to problems and bounded dispositions", () => {
    renderRoute("/problems", "/problems", <Problems />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Problem Board" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("Closed")).toBeInTheDocument();
    expect(screen.getByText(/Closed does not mean solved/)).toBeInTheDocument();
    expect(screen.queryByText(/candidate RFC/i)).toBeNull();
  });

  it("opens a closed problem without implying it was solved", () => {
    renderRoute(
      "/problems/prb-0002",
      "/problems/:problemId",
      <ProblemViewer />,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Portable review of admission receipts",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Unassessed")).toBeInTheDocument();
    expect(
      screen.getByText("Closed does not mean solved."),
    ).toBeInTheDocument();
  });

  it("renders proposals as a plain gallery and opens a viewer", () => {
    renderRoute("/proposals", "/proposals", <Proposals />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Proposal Board" }),
    ).toBeInTheDocument();
    expect(screen.getByText("PRP-0003")).toBeInTheDocument();
    expect(screen.getByText("PRP-0006")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();

    cleanup();
    renderRoute(
      "/proposals/prp-0003",
      "/proposals/:proposalId",
      <ProposalViewer />,
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Portable admission receipt viewer",
      }),
    ).toBeInTheDocument();
  });
});
