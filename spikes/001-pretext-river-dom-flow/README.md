# 001: Pretext DOM-flow ASCII river

## Question

Given Castalia's image-derived ASCII river, when `@chenglou/pretext` measures the occupied glyph run in each selected row, can real HTML stone links be centered in measured pixels without moving the row or rendering controls into Canvas?

## Constraints

- Production Castalia code is not imported or modified by the spike.
- The river remains DOM text.
- Stones remain keyboard-accessible `<a>` elements.
- WASM has no rendering, focus, or layout responsibility.
- This spike is disposable and uses a standalone package manifest.

## Run

```sh
npm install
npm run dev
```

Open `http://127.0.0.1:5184/`.

## Verdict: PARTIAL

### What worked

- Pretext measured the actual Unicode/font runs rather than assuming every glyph was `1ch`.
- The Commons balanced exactly at `125.23px / 125.23px`.
- RFC and Spaces landed within one measured Menlo cell (`9.63px`) of perfect balance, the minimum possible without splitting a glyph.
- All three stones remained real keyboard-focusable DOM links.
- Chromium reported no console errors and no serious or critical Axe findings.

### What did not justify adoption

- The measured placement is visually almost identical to the much smaller row-centering helper already in Castalia.
- The spike bundle is `52.74 kB` JavaScript / `18.35 kB` gzip, larger than the complete current Castalia Web JavaScript bundle (`36.69 kB` / `12.86 kB` gzip).
- Pretext lays out text; it does not place HTML inside Canvas or own obstacle geometry. The irregular obstacle-routing helpers shown in its demo are demo-local code we would still need to adapt and maintain.
- Reflowing one continuous glyph stream around obstacles would compromise the accepted image-derived fixed-slot silhouette.

### Recommendation

Do not add Pretext to the production river merely to center three stones. Keep the current DOM `<pre>` plus real links and the row-owned `centeredRock()` helper. Revisit Pretext only if Castalia deliberately changes to a fluid typographic river that must reflow around arbitrary moving shapes; even then, keep rendering and links in the DOM and keep WASM out of layout/focus responsibilities.
