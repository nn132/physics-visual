# Copilot instructions for physics-visual
# Copilot instructions for physics-visual
```instructions
# Copilot instructions for physics-visual
- Big picture: static, client-side physics visualization. No backend detected. The app maps user inputs (text, form fields, uploaded image/DOCX) into small physics simulations (uniform, projectile, circular, collision, magnetic, astrodynamics) and animates them in `#animation-container`.

- Key files/locations to inspect (quick jump):
  - `index1.0.3.html` — single-file app. Important IDs: `animation-container`, `animated-object`, `animated-object-2`, `generate-animation`, `play-animation`, `pause-animation`, `reset-animation`, `animation-time`, `animation-velocity`, `animation-position`, `animation-speed`, `show-trail`, `mobile-menu-button`, `mobile-menu`, `question-type-select`, `dynamic-params`, `problem-description`, `upload-image`, `upload-docx`, `apply-image`.
  - Key JS functions / constants inside the inline <script>:
    - computePixelsPerMeter() — maps meters → pixels using `animation-container` height and `maxFallDistance`.
    - getParams() — collects inputs per question type.
    - effectiveGravity() — consults `window.GRAVITY_OVERRIDE` or default `gravity` constant.
    - updateAnimation() — dispatches per motion type (uniform, projectile, circular, collision, magnetic, astrodynamics) and is the main animation loop driven by requestAnimationFrame.
    - startAnimation(), stopAnimation(), resetAnimation(), addTrailPoint().

- External libs: Tailwind (cdn.tailwindcss.com), Font Awesome, Chart.js (unused globally but available), Mammoth.js (client-side .docx → text). No package.json or build tooling is present.

- Runtime patterns and gotchas:
  - DOM-driven: state is read directly from inputs each frame (getParams()). Avoid heavy re-querying; if you add new inputs, follow existing id patterns and update getParams().
  - Animation loop: uses requestAnimationFrame and manual time increments (currentTime += 0.05/0.1 divided by `animation-speed`); ensure stopAnimation() cancels frames and that generate/reset clear secondary elements (e.g., `#animated-object-2` and trail points).
  - Responsive mapping: computePixelsPerMeter() recalculates pixels-per-meter each frame using container height (important for mobile where container uses 40vh). Tests should include narrow-screen sizes.
  - Trail cleanup: resetAnimation() removes child divs of `#animation-container` except `#animated-object` — don't add persistent children without an id.

- Examples & quick edits (copy/paste safe):
  - Change gravity default: edit `const gravity = 10;` near the top of the inline script.
  - Add a new control: add an input with an id in the left panel, then read it in getParams() and reference it in the per-type branch of updateAnimation().
  - Parse Word docs: Mammoth is used to extract plain text from uploaded .docx files and populate `#problem-description`.

- Developer workflows (how to run/debug):
  - No build step. Open `index1.0.3.html` in a browser to run. Quick Windows PowerShell preview: `ii index1.0.3.html`.
  - Use browser DevTools to:
    - Modify inputs live and call `startAnimation()`, `stopAnimation()`, `resetAnimation()` from console.
    - Toggle `window.GRAVITY_OVERRIDE = 9.8` to test non-default gravity.
    - Observe layout breakpoints: test at mobile widths to validate computePixelsPerMeter() behavior.

- Project-specific conventions:
  - Keep code changes minimal and localized inside `index1.0.3.html` — this repo intentionally packs logic inline and relies on id-based wiring.
  - Prefer adding small helper functions rather than large refactors. If extracting JS to a module, load it after `</body>` and preserve the same IDs and init order.
  - Use Tailwind utilities in-place; avoid creating a separate large stylesheet unless adding new global styles.

- Integration points / extension hooks:
  - `parseDescriptionToParams()` — small heuristic NLP; update it if you need richer extraction.
  - Mammoth-based DOCX import writes to `#problem-description` — you can reuse that hook for other import types.
  - Chart.js is available (global `Chart`) if you want to add velocity/position charts; prefer creating a new canvas outside `#animation-container`.

- Minimal tests to add (recommended):
  - Unit/visual smoke: open page, select `projectile`, set speed/angle, click `生成可视化` and verify `animated-object` moves and `animation-time` updates.
  - Responsive: set narrow viewport (mobile) and run a uniform case to confirm pixelsPerMeter scales.

If anything here looks incomplete or you'd like me to expand an example (e.g., extract JS to modules, add a small unit test with JSDOM, or wire a Chart.js panel), tell me which area to expand and I will update this file.
```