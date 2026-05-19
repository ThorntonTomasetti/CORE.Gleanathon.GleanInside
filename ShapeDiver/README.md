# Basement Wall Calculator with Glean AI Chatbot

A single-page web app that combines the **ShapeDiver Basement Wall Calculator** with an embedded **Glean AI chat assistant**.

## Overview

The app displays two panels side by side:

- **Left panel** — ShapeDiver 3D configurator for a basement wall calculator
- **Right panel** — Glean AI chatbot for answering questions and assisting with inputs

## Files

| File | Description |
|------|-------------|
| `basementwall app with chatbot.html` | Main app — open this in a browser |

## How to Use

1. Open `basementwall app with chatbot.html` in any modern browser (no server required).
2. The ShapeDiver model loads in the left panel — adjust parameters such as wall height, thickness, and other geometry inputs to update the 3D model in real time.
3. Use the Glean AI chatbot on the right panel to ask questions about the app or get help with inputs.

### Toggle the Chatbot

A circular blue button is pinned to the **top-right corner** of the page:

- **✕ icon** — chat is visible; click to hide it
- **Chat bubble icon** — chat is hidden; click to show it

Hovering the button shows a "Hide Chat" / "Show Chat" tooltip. The ShapeDiver viewer expands to fill the full width when the chat is hidden.

### Chatbot prompt example

1. How to input basement wall calculator app's Variable Wall Thickness?

## Tech Stack

| Component | Technology |
|-----------|------------|
| 3D Configurator | [ShapeDiver](https://www.shapediver.com/) via CORE Iframe Wrapper |
| AI Chatbot | [Glean Web SDK](https://app.glean.com) — embedded chat agent |
| Hosting | Static HTML — no backend required |

## Dependencies

Both dependencies are loaded from CDN and require an internet connection:

- `https://app.glean.com/embedded-search-latest.min.js` — Glean Web SDK
- `https://tt-acm.github.io/CORE.Iframe.Wrapper/` — ShapeDiver iframe wrapper (slug: `basement-wall-calculator`)

## Configuration

| Setting | Value |
|---------|-------|
| Glean Agent ID | `42349c7312dd4630aae2c75daa64803b` |
| ShapeDiver Model Slug | `basement-wall-calculator` |

To swap in a different ShapeDiver model, update the `slug` query parameter in the iframe `src`. To use a different Glean agent, update the `agentId` in the script block.

## Layout

- **Desktop (>900px):** side-by-side split with chatbot fixed at 400px wide
- **Mobile (≤900px):** stacked vertically — 3D viewer on top (60vh), chatbot below (40vh)
- Hiding the chat panel expands the 3D viewer to full width/height on both desktop and mobile
