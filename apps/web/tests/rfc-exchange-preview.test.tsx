import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { RfcExchangePreview } from "../src/rfcExchangePreview.js";

afterEach(cleanup);

function renderPreview() {
  return render(
    <MemoryRouter>
      <RfcExchangePreview />
    </MemoryRouter>,
  );
}

describe("RFC exchange design preview", () => {
  it("renders a fixture-only Problem Board without submission controls", () => {
    renderPreview();
    expect(
      screen.getByRole("heading", { level: 1, name: "Problem Board" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Fixture only — Not published"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Search hardness in proof-system repair",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("RFC claims to address this problem"),
    ).toHaveLength(2);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByText(/winner/i)).not.toBeInTheDocument();
  });

  it("switches among neutral comparison and directed exchange views locally", async () => {
    const user = userEvent.setup();
    renderPreview();
    await user.click(screen.getByRole("button", { name: "Compare RFCs" }));
    expect(
      screen.getByRole("heading", { name: "Neutral RFC comparison" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No score, rank, or recommendation"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/winner/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Exchange thread" }));
    expect(
      screen.getByRole("heading", { name: "Directed specialist request" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Requested actor: person:lin")).toBeInTheDocument();
    expect(screen.getByText(/No notification was sent/)).toBeInTheDocument();
    expect(screen.getByText("Preserved dissent")).toBeInTheDocument();
  });

  it("scopes synthetic WMT evidence to separate personal and RFC buckets", async () => {
    const user = userEvent.setup();
    renderPreview();
    await user.click(screen.getByRole("button", { name: "WMT evidence" }));
    expect(screen.getByText("Analysis unavailable")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Show synthetic bucket evidence" }),
    );
    expect(
      screen.getByText("Synthetic bucket evidence — not executed"),
    ).toBeInTheDocument();
    expect(screen.getByText("BKT-ADA · version 3 → 4")).toBeInTheDocument();
    expect(
      screen.getByText(/Consistent in this person's bucket/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("RFC-BKT-0042 · version 1 unchanged"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Conflict receipt/)).toBeInTheDocument();
    expect(
      screen.getByText(/This evidence decides nothing for the exchange/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Export preview" }));
    expect(screen.getByText("Not published")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Download unavailable in design preview",
      }),
    ).toBeDisabled();
  });
});
