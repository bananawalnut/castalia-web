import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { Docs } from "../src/Docs.js";
import { Layout } from "../src/Layout.js";
import { NotFound, Rooms } from "../src/pages.js";
import { CommonsRoom } from "../src/Spaces.js";
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
function at(path: string) {
  return render(
    <RouterProvider
      router={createMemoryRouter(
        [
          {
            element: <Layout />,
            children: [
              { path: "/", element: <Rooms /> },
              { path: "/room/zenith", element: <CommonsRoom /> },
              { path: "/docs", element: <Docs /> },
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
  it("renders the exact unavailable Commons room without controls", () => {
    at("/room/zenith");
    expect(
      screen.getByRole("heading", { level: 1, name: "The Commons" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Room unavailable")).toBeInTheDocument();
    expect(screen.getByText(/Live messages, membership/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Back to Zenith Space/ }),
    ).toHaveAttribute("href", "/spaces/zenith");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
  it("removes the old generic room route", () => {
    at("/room/other");
    expect(
      screen.getByRole("heading", { name: "Page not found" }),
    ).toBeInTheDocument();
  });
  it("leaves Story intentionally unimplemented", () => {
    at("/story");
    expect(
      screen.getByRole("heading", { name: "Page not found" }),
    ).toBeInTheDocument();
  });
  it("has canonical accessible navigation", () => {
    at("/");
    expect(
      screen.getByRole("navigation", { name: "Primary" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByText("Skip to content")).toBeInTheDocument();
    const primaryLinks = within(
      screen.getByRole("navigation", { name: "Primary" }),
    ).getAllByRole("link");
    expect(primaryLinks).toHaveLength(4);
    expect(primaryLinks.map((link) => link.textContent)).toEqual([
      "Spaces",
      "RFC",
      "The Commons",
      "Docs",
    ]);
    expect(screen.queryByText("Session unavailable")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Castalia" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("an open spring for independent worlds."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Story →" })).toHaveAttribute(
      "href",
      "/story",
    );
    expect(
      within(screen.getByRole("navigation", { name: "Primary" })).getByRole(
        "link",
        { name: "The Commons" },
      ),
    ).toHaveAttribute("href", "/room/zenith");
    expect(
      within(screen.getByRole("navigation", { name: "Primary" })).getByRole(
        "link",
        { name: "RFC" },
      ),
    ).toHaveAttribute("href", "/rfcs");
    expect(
      within(screen.getByRole("navigation", { name: "Primary" })).getByRole(
        "link",
        { name: "Spaces" },
      ),
    ).toHaveAttribute("href", "/spaces");
    expect(
      screen.queryByRole("heading", { name: "Rooms" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Members unavailable")).not.toBeInTheDocument();
  });
  it("keeps decorative river text hidden while exposing inline rock links", () => {
    const view = at("/");
    const stream = view.container.querySelector(".bitmap-stream");

    expect(stream).not.toHaveAttribute("aria-hidden");
    expect(stream?.querySelector("pre")).toBeInTheDocument();
    expect(stream?.querySelectorAll("pre .riverbank-action")).toHaveLength(6);
    expect(
      stream?.querySelectorAll('[aria-hidden="true"]').length,
    ).toBeGreaterThan(6);
    expect(
      stream?.querySelector(".bitmap-stream__art--desktop")?.textContent,
    ).toMatch(/^·γβ/u);
    expect(stream?.textContent).toMatch(/[αβγδεζηθλμξπρσφψω]/);
    expect(stream?.textContent).toMatch(/[⊕⊗⊘⊙⊚⊛△▽◯✦✧⌬⍟⌖]/);
  });
  it("renders a full pixel night sky with an unconnected Aquarius pattern", () => {
    const view = at("/");
    const sky = view.container.querySelector(".pixel-night-sky");
    const constellation = view.container.querySelector(
      '[data-constellation="Aquarius"]',
    );

    expect(sky).toHaveAttribute("aria-hidden", "true");
    expect(sky?.querySelectorAll(".pixel-star--field")).toHaveLength(35);
    expect(constellation?.querySelectorAll(".pixel-star")).toHaveLength(13);
    expect(constellation?.querySelector("svg, line")).not.toBeInTheDocument();
  });
  it("glitches complete Pistis Sophia phrases directly into river slots", () => {
    vi.useFakeTimers();
    const view = at("/");
    const river = view.container.querySelector(".bitmap-stream__art--desktop");
    const original = river?.textContent ?? "";
    let phraseFrame = "";
    let phraseAppeared = false;
    let redactionAppeared = false;

    for (let step = 0; step < 180 && !phraseAppeared; step += 1) {
      act(() => {
        vi.advanceTimersToNextTimer();
      });
      const text = (river?.textContent ?? "").replaceAll("·", " ");
      phraseAppeared =
        /lumen luminum|serva me, lumen|ego sum tua vis|altitudine/u.test(text);
      if (phraseAppeared) phraseFrame = river?.textContent ?? "";
      redactionAppeared ||= /[░▒▓█]/u.test(text);
    }

    expect(phraseAppeared).toBe(true);
    expect(redactionAppeared).toBe(true);
    expect(phraseFrame.replace(/\S/gu, "#")).toBe(
      original.replace(/\S/gu, "#"),
    );
    expect(view.container.querySelector("[data-pistis-whisper]")).toBeNull();
  });
  it("mutates a sparse set of fixed water slots per calm animation tick", () => {
    vi.useFakeTimers();
    const view = at("/");
    const river = view.container.querySelector(".bitmap-stream__art--desktop");
    const before = river?.textContent ?? "";

    act(() => {
      vi.advanceTimersByTime(180);
    });

    const after = river?.textContent ?? "";
    const beforeSymbols = Array.from(before);
    const afterSymbols = Array.from(after);
    const occupiedCount = beforeSymbols.filter(
      (symbol) => !/\s/u.test(symbol),
    ).length;
    const changedCount = beforeSymbols.filter(
      (symbol, index) => symbol !== afterSymbols[index],
    ).length;
    const slotMask = (value: string) => value.replace(/\S/gu, "#");
    const mutationRatio = changedCount / occupiedCount;

    expect(after).not.toBe(before);
    expect(slotMask(after)).toBe(slotMask(before));
    expect(mutationRatio).toBeGreaterThan(0.005);
    expect(mutationRatio).toBeLessThan(0.08);
  });
  it("keeps the river static when reduced motion is requested", () => {
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));
    const view = at("/");
    const river = view.container.querySelector(".bitmap-stream__art--desktop");
    const before = river?.textContent;

    act(() => {
      vi.advanceTimersByTime(1800);
    });

    expect(river?.textContent).toBe(before);
  });
  it("renders a compact docs map for the retained surfaces", () => {
    at("/docs");
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Documentation",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Current surfaces" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Story" })).toBeInTheDocument();
    expect(screen.getByText(/An RFC is not a Space/)).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /RFC Board/ })).toHaveAttribute(
      "href",
      "/rfcs",
    );
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
