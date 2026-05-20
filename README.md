# gleaninside

An injectable helper chatbot backed by Glean. Drop one `<script>` tag and one `<glean-helper>` element into any app (Vue, React, plain HTML) and a robot button appears in the corner; click it to chat with an assistant scoped to that specific app's Glean knowledge — or routed through a specific Glean Agent.

## What's in this repo

- `widget/` — the embeddable Web Component source (Vue 3 `defineCustomElement`).
- `server/` — Node/Express backend that holds the Glean API key and calls Glean on the widget's behalf.
- `src/` — a Vue/Vuetify demo host that embeds the widget for local development.
- `demo/vanilla.html` — a plain-HTML page proving the widget works without any framework.

## How the pieces fit together

```
┌────────────────────┐    POST /api/chat    ┌──────────────────────┐    HTTPS    ┌────────┐
│  Host app (Swap,   │  ───────────────────▶│  gleanathon backend  │ ──────────▶ │ Glean  │
│  React site, etc.) │   { appId, message,  │  (Express on :3001)  │  Bearer key │        │
│                    │     agentId? }       │                      │             │        │
│ <glean-helper>     │◀────── answer ───────│  holds GLEAN_API_KEY │◀──── reply ─│        │
└────────────────────┘                      └──────────────────────┘             └────────┘
```

The Glean API key **must stay on the backend**. If you put it in the browser bundle, anyone visiting any page that loads the widget can read it and use it. The widget is just frontend; all Glean calls go through the gleanathon backend.

---

# Embedding the chatbot in your own application

This is a step-by-step guide. Follow it in order.

## Step 1 — Prerequisites

You need:

- **Node 20+** and **npm** installed locally.
- **A Glean Client API token** for your tenant. Get one from your Glean admin (Glean admin console → "API access"). The token is a long opaque string — treat it like a password.
- **Your Glean tenant base URL.** It looks like `https://<your-company>-be.glean.com`. Your Glean admin can confirm.
- *(Optional)* **A Glean Agent ID** if you want to route chat through a specific agent instead of plain Glean Chat. The ID is shown in the URL bar when you open the agent in Glean (e.g. `c3e7a91dfdff4392a954188d92ef4d29`).

## Step 2 — Clone and install

```bash
git clone <this-repo-url> gleanathon
cd gleanathon
npm install
```

`npm install` also installs the backend's dependencies (there's a `postinstall` hook that runs `npm --prefix server install`).

## Step 3 — Configure the backend secrets

```bash
cp server/.env.example server/.env
```

Open `server/.env` in an editor and set:

```ini
# From your Glean admin
GLEAN_BASE_URL=https://your-tenant-be.glean.com
GLEAN_API_KEY=<paste your Glean Client API token here>

# Comma-separated list of origins (the URLs of pages that will embed the widget).
# For local development, list every dev URL your host apps run on.
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:1337

# Port the backend listens on. Leave as 3001 unless it conflicts with something.
PORT=3001
```

`server/.env` is gitignored. **Never commit your token.**

## Step 4 — Register your app

Each host app gets its own `app-id`. The id lets the backend scope Glean results to only that app's documents (so a chatbot embedded in App A doesn't surface App B's documents). Register the id in `server/src/appScopes.ts`:

```ts
export const appScopes: Record<string, AppScope> = {
  // ... existing entries ...
  'my-app': {
    label: 'My App',
    filters: {
      // Restrict to documents tagged with this label in Glean. Change the
      // filter to whatever isolates your app's content — datasource, label,
      // collection, etc. See Glean's facet filter docs.
      facetFilters: [{ fieldName: 'label', values: [{ value: 'my-app' }] }],
    },
  },
}
```

> **If your host app uses a Glean Agent instead**, you can still register an `app-id` but the filter is ignored — the agent decides its own retrieval scope. Register the id anyway so the backend will accept the request (unregistered ids return 404).

## Step 5 — Build the widget bundle

```bash
npm run build:widget
```

This produces a single file at `dist-widget/glean-helper.js` (~75KB gzipped). That file is everything your host app needs on the frontend — it includes Vue, the chat UI, and the API client, all in one self-contained script. Nothing to `npm install` in the host app.

## Step 6 — Host the widget bundle

Your host app needs to be able to load `glean-helper.js` via a `<script src="...">`. Pick the easiest path that fits your situation:

### Option A — Copy it into your host app's static folder (simplest)

Most web frameworks have a folder whose contents get served as-is. Examples:

- **Vue CLI / vue-cli-service:** `public/`
- **Vite:** `public/`
- **Next.js:** `public/`
- **Create React App:** `public/`
- **Plain Express:** wherever you've configured `express.static`

Copy the built file in:

```bash
cp dist-widget/glean-helper.js /path/to/your-app/public/glean-helper.js
```

Your host app will then serve it at `/glean-helper.js` (relative to its domain).

### Option B — Host on a CDN

Upload `dist-widget/glean-helper.js` to S3 + CloudFront, Cloudflare R2, Netlify, Vercel static, Azure Blob, or GitHub Pages. Reference it by its full URL in the embed. Useful when you have many host apps and want a single canonical version.

### Option C — Publish as an npm package

For host apps that already use a bundler (webpack, Vite, etc.), you can publish `dist-widget/` to npm and `import` it. Overkill for HTML drop-in; only worth it if your hosts have a build pipeline that wants the dependency tracked.

## Step 7 — Deploy the backend

The gleanathon backend (the contents of `server/`) needs a public HTTPS URL that the host app can reach.

**For local development**, just run it on your machine:

```bash
npm run dev:server   # listens on http://localhost:3001
```

**For production**, deploy `server/` to any Node-friendly host: Fly.io, Render, Railway, Azure App Service, AWS App Runner / Elastic Beanstalk, Google Cloud Run, your own VM, etc.

Whatever you pick, the host needs to:

- Run `npm install` then `npm start` (or equivalent) inside `server/`.
- Set the env vars from step 3 (`GLEAN_BASE_URL`, `GLEAN_API_KEY`, `ALLOWED_ORIGINS`, `PORT`).
- Expose the resulting URL over HTTPS.

**Critical:** make sure `ALLOWED_ORIGINS` lists the exact origin of each host app's deployed page (e.g. `https://app.example.com`). If it's unset, the backend allows any origin — fine for local dev, dangerous in production because anyone on the internet can call your endpoint and drain your Glean quota.

## Step 8 — Embed the widget in your host app

Add two HTML tags somewhere the browser will load them — typically right before `</body>`. For frameworks with an `index.html` template (Vue CLI's `public/index.html`, Vite's `index.html`, Next.js's `_document.tsx`, etc.) put them there. For a pure SPA component, drop them into the root template.

### Minimum embed (plain Glean Chat, scoped by app-id)

```html
<script src="/glean-helper.js"></script>
<glean-helper
  app-id="my-app"
  api-url="https://your-backend.example.com/api/chat"
></glean-helper>
```

### With a Glean Agent

```html
<script src="/glean-helper.js"></script>
<glean-helper
  app-id="my-app"
  agent-id="c3e7a91dfdff4392a954188d92ef4d29"
  api-url="https://your-backend.example.com/api/chat"
></glean-helper>
```

### Attributes reference

| Attribute      | Required | Description                                                                                  |
| -------------- | -------- | -------------------------------------------------------------------------------------------- |
| `app-id`       | yes      | Must match an entry in `server/src/appScopes.ts`. Determines retrieval scope.                |
| `api-url`      | yes      | Full URL of the gleanathon backend's chat endpoint. Include `/api/chat`.                     |
| `agent-id`     | no       | If set, routes through Glean Agents API instead of plain Chat.                               |
| `title`        | no       | Custom heading text in the chat panel. Defaults to `"Helper"`.                               |
| `page-context` | no       | Set to `"false"` to disable automatic page context collection. Defaults to enabled.          |

The widget renders a fixed-position floating button in the bottom-right corner of the page, so the placement of the `<glean-helper>` tag in the DOM doesn't matter — anywhere inside `<body>` works.

### Overriding the agent ID during development

During development you can switch agent IDs without editing HTML or restarting anything. The widget resolves the agent ID in this priority order:

1. **URL query parameter** (highest) — `?agentId=abc123`
2. **localStorage** — `glean-agent-id` key
3. **HTML attribute** — `agent-id="..."` on `<glean-helper>`

Examples:

```
# Just change the URL
http://localhost:3000?agentId=532b0e6b1e2b47feae7a373fca9fc1da

# Or set it once in the browser console — persists across refreshes
localStorage.setItem('glean-agent-id', '532b0e6b1e2b47feae7a373fca9fc1da')

# Clear the override
localStorage.removeItem('glean-agent-id')
```

This makes it easy to test different agents without touching code. In production, the HTML attribute is the source of truth.

## Step 9 — Try it

1. Start the backend: `npm run dev:server` (or open the deployed URL in a browser and check it returns `{ ok: true }` at `/health`).
2. Open your host app in a browser.
3. Look for the purple robot button in the bottom-right corner.
4. Click it, type a question, hit Send.

If nothing happens or you see an error, jump to **Troubleshooting** below.

## Step 10 — Updating the widget

Whenever you change widget source code, host apps don't get the update automatically — the file in their `public/` folder (or CDN) is a snapshot. To update:

```bash
npm run build:widget
cp dist-widget/glean-helper.js /path/to/your-app/public/glean-helper.js
# then redeploy your host app
```

If you host the widget on a CDN, also bust the browser cache. Easiest way: append a version query string in the embed:

```html
<script src="https://cdn.example.com/glean-helper.js?v=2024-05-01"></script>
```

Bump the value whenever you republish.

---

## Troubleshooting

### `Uncaught ReferenceError: process is not defined`

The widget bundle was built without substituting `process.env.NODE_ENV`. Rebuild with `npm run build:widget` and copy the new file into your host app's static folder. Recent versions of this repo fix this in `vite.widget.config.mts`; if you're on an older version, pull and rebuild.

### `unknown appId: my-app` (404)

You haven't added an entry for `my-app` in `server/src/appScopes.ts`. Add one (see step 4) and restart the backend.

### `chat request failed (401)` or `Please provide token`

The Glean API key isn't being accepted. Check:

- `GLEAN_API_KEY` in `server/.env` is correct and not expired.
- For Agents (`agent-id` set), your token has Agents API access — it's a separate Glean permission. Ask your Glean admin to enable it on the token.

### `(no answer)`

The backend successfully called Glean but the response had no extractable answer text. Most common causes:

- The `app-id`'s facet filter doesn't match any indexed documents — Glean returns an empty response.
- The Agent's input parameter name isn't `message`. Glean Agents declare named inputs; if yours uses `query` or `prompt` instead, edit `server/src/glean.ts` where `input: { message: args.message }` is built and change the key.

### CORS errors in the browser console

The page's origin isn't in `ALLOWED_ORIGINS`. Add it to `server/.env`, restart the backend.

### Robot button doesn't appear

- Check the browser console for script-load errors. Most often `glean-helper.js` is at the wrong path — open the URL directly to confirm it loads.
- Check that the host app doesn't have a fixed-position element with `z-index: 2147483647`+ covering it.

### `vue-cli-service` warns about unknown element `<glean-helper>`

Vue 3 expects custom elements to either contain a hyphen (which `glean-helper` does, so this is usually fine) or be declared via `app.config.compilerOptions.isCustomElement`. If you put the `<glean-helper>` tag inside a Vue template (rather than `index.html`), set:

```js
const app = createApp(App)
app.config.compilerOptions.isCustomElement = tag => tag === 'glean-helper'
```

before `app.mount()`. Or just keep the tag in `index.html` outside the Vue root.

---

## Page context

The widget can automatically capture page context and send it alongside every user message. This gives the Glean agent awareness of what the user is looking at — no manual copy-pasting needed.

### What gets captured

| Field | Source | Example |
|-------|--------|---------|
| **URL** | Browser `location.href` | `https://myapp.com/projects/42` |
| **Page title** | `document.title` | `Project Dashboard` |
| **HTML snippet** | Sanitised page body (or `[data-glean-context]` element) | Cleaned HTML, up to 8 KB |
| **Active view** | Host app via `postMessage` | `3D View - Level 2` |
| **Metadata** | Host app via `postMessage` | `{ "selectedElements": "3 walls" }` |

The HTML is automatically sanitised: `<script>`, `<style>`, `<svg>`, `<noscript>`, and the widget itself are stripped. Class names, inline styles, and `data-*` attributes are removed. What remains is the semantic structure — headings, tables, text content, links, inputs.

### How the agent receives it

Context is prepended to the user's message as a structured text block:

```
[Page Context]
URL: https://myapp.com/projects/42
Page title: Project Dashboard
Active view: Floor Plan - Level 2
selectedElements: 3 walls, 1 door
HTML snippet:
<h2>Tower A</h2>
<table><tr><td>Status</td><td>In Review</td></tr></table>
[End Context]

Why are these tasks overdue?
```

No special API features are required — the agent sees this as part of the message input.

### Disabling context for .NET / desktop hosts

Apps embedded in WebView2 (Revit, WPF, etc.) where the page HTML is just the widget shell should disable page context to avoid confusing the agent:

```html
<glean-helper app-id="core-swap" agent-id="..." page-context="false" />
```

### Sending context from native host apps (postMessage)

Native host apps can push structured context via `postMessage` instead of (or alongside) browser-collected HTML:

```js
webview.postMessage(JSON.stringify({
  type: "glean-context",
  payload: {
    activeView: "Floor Plan - Level 2",
    pageTitle: "My Revit Project",
    metadata: {
      selectedElements: "3 walls, 1 door",
      documentPath: "C:/Projects/TowerA.rvt"
    }
  }
}));
```

Context is merged with any browser-collected data. It can be sent at any time — the widget takes the latest snapshot when the user sends a message.

### Targeted HTML capture

If only part of the page is relevant, mark it with `data-glean-context`:

```html
<div data-glean-context>
  <h2>Project: Tower A</h2>
  <table>...</table>
</div>
```

When present, this takes priority over the full `document.body`.

### Glean agent instructions

When configuring your Glean agent, include guidance like:

> The user's message may begin with a `[Page Context]` block containing the URL, page title, visible HTML, and app-specific metadata from the page they are viewing. Use this context to ground your answers — reference specific elements, values, or states visible on the page when relevant. If no context block is present, answer normally.

---

## Security checklist before shipping to production

- [ ] `ALLOWED_ORIGINS` is set explicitly. Don't leave it blank.
- [ ] Glean API key is loaded from secrets (env vars, AWS Secrets Manager, etc.) — not committed.
- [ ] HTTPS on the backend. Browsers will block mixed-content requests from HTTPS host pages to HTTP backends.
- [ ] Rate limiting in front of `/api/chat` — without it, a misbehaving page can drain your Glean quota. Add `express-rate-limit` keyed by IP.
- [ ] Authentication on `/api/chat` if your host apps aren't fully public. The endpoint is anonymous by default — anyone who knows the URL and a registered `app-id` can ask questions.

---

## Local development with the demo host

If you just want to see the widget running before integrating with a real host app:

```bash
npm run dev
```

Starts the Vite dev server on `http://localhost:3000` and the backend on `http://localhost:3001`. Vite proxies `/api` to the backend, so the widget works without CORS configuration. Click the robot button in the bottom-right and start chatting.

## Available scripts

- `npm run dev` — Vite + Express together (full demo stack)
- `npm run dev:web` / `npm run dev:server` — run either side alone
- `npm run dev:widget` — rebuild `dist-widget/` on every widget change
- `npm run build:widget` — production build of the embeddable widget bundle
- `npm run build` — type-check + production build of the Vue demo host
- `npm run lint` / `npm run lint:fix`
- `npm run type-check`
