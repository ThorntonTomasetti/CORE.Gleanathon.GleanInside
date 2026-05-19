# gleaninside

An injectable helper chatbot backed by Glean. Drop one `<script>` tag and one `<glean-helper>` element into any app (Vue, React, plain HTML) and a robot button appears in the corner; click it to chat with an assistant scoped to that specific app's Glean knowledge.

## What's in this repo

- `widget/` — the embeddable Web Component source (Vue 3 `defineCustomElement`).
- `server/` — Node/Express backend that holds the Glean API key and calls Glean Chat on the widget's behalf.
- `src/` — a Vue/Vuetify demo host that embeds the widget for local development.
- `demo/vanilla.html` — a plain-HTML page proving the widget works without any framework.

## Prerequisites

- Node 20+ and npm
- A Glean Client API token for your tenant

## Setup

```bash
# 1. install dependencies (root + server)
npm install

# 2. configure the backend
cp server/.env.example server/.env
# then edit server/.env and fill in:
#   GLEAN_BASE_URL=https://<your-tenant>-be.glean.com
#   GLEAN_API_KEY=<your-client-api-token>
```

`server/.env` is gitignored. Never commit your token.

## Run

```bash
npm run dev
```

Starts the Vite dev server on `http://localhost:3000` and the Express backend on `http://localhost:3001` (Vite proxies `/api` to it). Open the browser, click the robot button in the bottom-right corner, and ask a question.

## Build the embeddable widget

```bash
npm run build:widget
```

Produces `dist-widget/glean-helper.js` — a single self-contained file. Host it anywhere static, then add two lines to any app:

```html
<script src="https://your-cdn/glean-helper.js"></script>
<glean-helper app-id="my-app" api-url="https://your-backend/api/chat"></glean-helper>
```

## Adding a new app

Each app gets its own `app-id` so the bot only sees that app's knowledge. Register the id and its Glean filter in `server/src/appScopes.ts`:

```ts
export const appScopes: Record<string, AppScope> = {
  'my-app': {
    label: 'My App',
    filters: {
      facetFilters: [{ fieldName: 'label', values: [{ value: 'my-app' }] }],
    },
  },
}
```

Then drop `<glean-helper app-id="my-app">` into the host app.

## Available scripts

- `npm run dev` — Vite + Express together
- `npm run dev:web` / `npm run dev:server` — run either side alone
- `npm run dev:widget` — rebuild `dist-widget/` on every widget change
- `npm run build` — type-check + production build of the Vue demo
- `npm run build:widget` — production build of the embeddable widget bundle
- `npm run lint` / `npm run lint:fix`
- `npm run type-check`
