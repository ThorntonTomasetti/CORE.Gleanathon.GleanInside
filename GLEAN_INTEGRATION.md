# Glean AI Chat Widget — Revit Addin Integration Guide

This document explains how to embed the GleanInside chat widget into an existing Revit addin as a floating window using WebView2.

---

## What you're building

A borderless, topmost WPF window that dynamically resizes between two states:
- **Closed** (68×68): just enough for the widget's FAB launcher button
- **Open** (400×620): expands to fit the chat panel

The window hosts a WebView2 instance loading a minimal HTML page with the `<glean-helper>` custom element. The widget's HTML/CSS handles its own launcher, chat panel, drag, and resize — the WPF side is just the viewport. A `MutationObserver` in the HTML watches for panel open/close and posts size messages to C# via `window.chrome.webview.postMessage`, which triggers the WPF window resize.

---

## Architecture decisions

### Why WebView2 (not native WPF)?
Faster to prototype — the widget is shared with the web app. For production, a native WPF implementation eliminates the airspace, threading, and dev-server issues below (~1-2 days effort).

### Why a separate STA thread?
Revit commands use `ShowDialog()` which disables all WPF windows **on the same thread**. The widget runs on its own STA thread with its own `Dispatcher.Run()` loop, making it immune to modal dialogs. Same pattern used for Revit "Edit Mode" previews.

### Why not transparent?
`AllowsTransparency="True"` + WebView2 = broken mouse input (WPF airspace problem). The WebView2 HWND doesn't receive clicks in layered windows. Use an opaque background (white) instead — with dynamic sizing the visible footprint is minimal.

---

## Prerequisites

- .NET 8 (net8.0-windows7.0) or .NET Framework 4.8 — both work with WebView2
- WebView2 runtime installed (pre-installed on Windows 11; [download](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) for older machines)
- GleanInside dev servers running: `npm run dev` starts both Vite (`:3000`) and Express (`:3001`)
- A Glean agent ID
- A registered `appId` in `server/src/appScopes.ts` (e.g. `gleaninside`, `core-swap`)

---

## Step 1 — Add the NuGet package

In your `.csproj`:

```xml
<PackageReference Include="Microsoft.Web.WebView2" Version="1.0.2592.51" />
```

---

## Step 2 — Create the widget host page

Create `widget.html` in the GleanInside project root. Vite serves it at `http://localhost:3000/widget.html`.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style> html, body { margin: 0; padding: 0; height: 100%; background: transparent; } </style>
</head>
<body>
  <glean-helper app-id="gleaninside"></glean-helper>
  <script type="module" src="/widget/index.ts"></script>
  <script>
    // Notify host (WebView2) when widget opens/closes so it can resize the viewport.
    function watchWidgetState() {
      const el = document.querySelector('glean-helper');
      if (!el || !el.shadowRoot) { requestAnimationFrame(watchWidgetState); return; }
      let lastOpen = null;
      function check() {
        const panel = el.shadowRoot.querySelector('.panel');
        const isOpen = panel !== null;
        if (isOpen !== lastOpen) {
          lastOpen = isOpen;
          if (window.chrome && window.chrome.webview)
            window.chrome.webview.postMessage(JSON.stringify({ type: 'widget-state', open: isOpen }));
        }
      }
      const observer = new MutationObserver(check);
      observer.observe(el.shadowRoot, { childList: true, subtree: true });
      check();
    }
    requestAnimationFrame(watchWidgetState);
  </script>
</body>
</html>
```

Change `app-id` to match your registered app scope. The `agentId` is passed via URL query param (see Step 5).

---

## Step 3 — Copy the two UI files

Copy `GleanFabWidget.xaml` and `GleanFabWidget.xaml.cs` into your project's UI folder.
Adjust the namespace at the top of both files to match your project.

### GleanFabWidget.xaml

A borderless WPF `Window` containing only a WebView2 control and a loading overlay.

Key attributes on the `<Window>` element:
```xml
WindowStyle="None"
ShowInTaskbar="False"
Topmost="True"
Width="68" Height="68"
ResizeMode="NoResize"
Background="White"
```

No WPF FAB button, no toggle logic — the widget's HTML handles its own launcher, panel, drag-to-move, and resize. The window starts at 68×68 (FAB size) and dynamically resizes to 400×620 when the chat panel opens.

### GleanFabWidget.xaml.cs

- Set `WidgetUrl` to the widget host page + agent ID:
  ```csharp
  private const string WidgetUrl = "http://localhost:3000/widget.html?agentId=YOUR_AGENT_ID";
  ```
- Viewport sizes are configured via constants:
  ```csharp
  private const double ClosedWidth = 68;
  private const double ClosedHeight = 68;
  private const double OpenWidth = 400;
  private const double OpenHeight = 620;
  ```
- `AnchorBottomRight(w, h)` resizes and repositions the window, keeping it anchored to the bottom-right of the screen work area (50px above bottom edge).
- WebView2 is initialized in the `Loaded` event — **not** in the constructor. The STA thread's message loop must be running first.
- `WebMessageReceived` handles `widget-state` messages from the HTML observer and calls `AnchorBottomRight` with the appropriate dimensions.
- `EnsureVisible()` spawns the widget on a separate STA thread with its own dispatcher. Sets Revit's main window as owner via `WindowInteropHelper` so the widget minimizes/restores with Revit.
- `HideInstance()` hides the window. Call after your main workflow ends.

---

## Step 4 — Wire it into your command

In your `IExternalCommand.Execute()`:

```csharp
using YourNamespace.UI;

public Result Execute(ExternalCommandData commandData, ref string message, ElementSet elements)
{
    GleanFabWidget.EnsureVisible();

    // ... your command logic, including ShowDialog() calls ...

    // Hide the widget after your workflow completes
    GleanFabWidget.HideInstance();

    return Result.Succeeded;
}
```

### Important: do NOT call from OnStartup or ApplicationInitialized

Both run on background threads. Creating WPF windows there crashes Revit. `EnsureVisible()` must be called from `IExternalCommand.Execute()` (Revit UI thread) — it spawns the STA thread internally.

---

## Step 5 — Configure the agentId passthrough

In `ChatWidget.ce.vue`, add a computed that reads the `agentId` query param as a fallback:

```ts
const resolvedAgentId = computed(() =>
  props.agentId ?? new URLSearchParams(window.location.search).get('agentId') ?? undefined
)
```

Then use `resolvedAgentId.value` instead of `props.agentId` when calling `postChat`.

---

## Dev setup

Run everything from the GleanInside repo root:

```
npm run dev
```

This starts both servers via `concurrently`:
- **Vite** on `:3000` — serves the widget HTML + JS with hot reload
- **Express** on `:3001` — proxied from Vite at `/api/*`

If you get `EADDRINUSE`, kill the stale process: `cmd /c "taskkill /F /PID <pid>"`.

If `tsx` is missing, install it globally: `npm install -g tsx`.

Then build and deploy your Revit addin, start Revit, and trigger your command.

---

## Sending Revit context into the chat (optional)

Use the WebView2 message channel to make the chat context-aware.

**C# → JS:**
```csharp
WebView.CoreWebView2.PostWebMessageAsString(JsonSerializer.Serialize(new {
    type = "revit-context",
    payload = new { documentTitle = doc.Title, selectedCount = 3 }
}));
```

**JS (in the widget):**
```js
window.chrome.webview.addEventListener('message', e => {
    const { type, payload } = JSON.parse(e.data)
    if (type === 'revit-context') { /* prepend context to chat input */ }
})
```

---

## Common pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| Revit crashes on startup | Widget created on `ApplicationInitialized` (background thread) | Only create from `IExternalCommand.Execute()` |
| Widget not clickable during `ShowDialog()` | Widget on same thread as modal dialog | Use `EnsureVisible()` which spawns a separate STA thread |
| Widget not clickable at all | `AllowsTransparency="True"` breaks WebView2 input | Remove `AllowsTransparency`, use opaque background |
| "cannot be used before event loop has started" | WebView2 initialized before `Dispatcher.Run()` | Initialize in `Loaded` event, not constructor |
| "Loading Glean..." stuck forever | WebView2 init failed silently (`async void`) | Add try/catch in `InitializeWebViewAsync` |
| ERR_CONNECTION_REFUSED | Dev servers not running | Run `npm run dev` (starts both Vite and Express) |
| `unknown appId` 404 | Wrong `app-id` on `<glean-helper>` | Check registered IDs in `server/src/appScopes.ts` |
| Widget stays on screen when Revit minimizes | No window owner set | Set Revit HWND as owner via `WindowInteropHelper` |
| Black rectangle / broken rendering | `AllowsTransparency` + WebView2 airspace conflict | Use opaque window, dynamic resize to minimize visible footprint |
