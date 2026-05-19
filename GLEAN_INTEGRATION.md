# Glean AI Chat Widget — Revit Addin Integration Guide

Embed a floating Glean chat widget into any existing Revit addin using WebView2. The sample files in `RevitPlugin/` are ready to copy — you only need to change a namespace, an agent ID, and two lines in your command.

---

## What you get

A borderless, topmost WPF window that floats over Revit (including during `ShowDialog()` modal workflows):
- **Closed** (68×68): just the FAB launcher button
- **Open** (370×542): expands to the chat panel

The widget runs on a separate STA thread so it stays interactive while your addin's modal dialogs are open. It minimizes/restores with Revit automatically.

---

## Prerequisites

- WebView2 runtime installed (pre-installed on Windows 11; [download](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) for older machines)
- GleanInside dev servers running: `npm run dev` from the repo root (starts Vite on `:3000` + Express on `:3001`)
- A Glean agent ID (get one from the Glean admin UI)

---

## Step 1 — Add the NuGet package

Add to your `.csproj`:

```xml
<PackageReference Include="Microsoft.Web.WebView2" Version="1.0.2592.51" />
```

---

## Step 2 — Copy the widget files

Copy these two files from `RevitPlugin/GleanInside.RevitPlugin/UI/` into your project's UI folder:

```
GleanFabWidget.xaml
GleanFabWidget.xaml.cs
```

Then make two changes:

1. **Namespace** — update the namespace in both files to match your project:

   In `GleanFabWidget.xaml`, change the `x:Class` attribute:
   ```xml
   x:Class="YourNamespace.UI.GleanFabWidget"
   ```

   In `GleanFabWidget.xaml.cs`, change the namespace declaration:
   ```csharp
   namespace YourNamespace.UI
   ```

2. **Agent ID** — in `GleanFabWidget.xaml.cs`, replace `YOUR_AGENT_ID` with your Glean agent ID:
   ```csharp
   private const string WidgetUrl = "http://localhost:3000/widget.html?agentId=YOUR_AGENT_ID";
   ```

That's it for the widget files. Everything else (STA thread, dynamic resizing, WebView2 init, postMessage bridge) works out of the box.

---

## Step 3 — Wire it into your command

Add two lines to your `IExternalCommand.Execute()`:

```csharp
using YourNamespace.UI;

public Result Execute(ExternalCommandData commandData, ref string message, ElementSet elements)
{
    GleanFabWidget.EnsureVisible();   // ← show the widget

    // ... your existing command logic, ShowDialog() calls, etc. ...

    GleanFabWidget.HideInstance();    // ← hide when your workflow ends
    return Result.Succeeded;
}
```

`EnsureVisible()` is idempotent — calling it multiple times won't spawn duplicate windows.

If you want the widget to stay visible across commands (not hide when one command ends), just call `EnsureVisible()` without `HideInstance()`.

---

## Step 4 — Run the dev servers

From the GleanInside repo root:

```
npm run dev
```

This starts both servers via `concurrently`:
- **Vite** on `:3000` — serves `widget.html` + JS with hot reload
- **Express** on `:3001` — API backend, proxied from Vite at `/api/*`

Then build your Revit addin, start Revit, and trigger your command.

---

## Optional: Send Revit context into the chat

Use the WebView2 message channel to make the chat context-aware:

**C# → JS:**
```csharp
WebView.CoreWebView2.PostWebMessageAsString(JsonSerializer.Serialize(new {
    type = "revit-context",
    payload = new { documentTitle = doc.Title, selectedCount = 3 }
}));
```

**JS (in widget.html):**
```js
window.chrome.webview.addEventListener('message', e => {
    const { type, payload } = JSON.parse(e.data)
    if (type === 'revit-context') { /* prepend context to chat input */ }
})
```

---

## Optional: Adjust viewport size

In `GleanFabWidget.xaml.cs`, change the constants to fit your layout:

```csharp
private const double ClosedWidth = 68;
private const double ClosedHeight = 68;
private const double OpenWidth = 370;
private const double OpenHeight = 542;
```

The `AnchorBottomRight` method positions the widget at the bottom-right of the screen. Edit it if you want a different anchor point.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Revit crashes on startup | Widget created from `OnStartup` or `ApplicationInitialized` (background thread) | Only call `EnsureVisible()` from `IExternalCommand.Execute()` |
| Widget not clickable during `ShowDialog()` | Widget on same thread as modal dialog | Already handled — `EnsureVisible()` spawns a separate STA thread |
| Widget not clickable at all | `AllowsTransparency="True"` on the Window | Don't add `AllowsTransparency` — breaks WebView2 mouse input (WPF airspace problem) |
| "cannot be used before event loop has started" | WebView2 initialized before `Dispatcher.Run()` | Already handled — init is in the `Loaded` event, not the constructor |
| "Loading Glean..." stuck forever | WebView2 init failed silently | Check the overlay text for error details; verify WebView2 runtime is installed |
| ERR_CONNECTION_REFUSED | Dev servers not running | Run `npm run dev` from the repo root |
| `unknown appId` 404 | Wrong `app-id` on `<glean-helper>` in `widget.html` | Check registered IDs in `server/src/appScopes.ts` |
| Widget stays on screen when Revit minimizes | No window owner set | Already handled — `EnsureVisible()` sets Revit's HWND as owner |
| EADDRINUSE on port 3001 | Stale server process | Kill it: `taskkill /F /PID <pid>` (find pid with `netstat -ano | findstr :3001`) |

---

## File reference

| File | What it does |
|---|---|
| `RevitPlugin/.../UI/GleanFabWidget.xaml` | WPF window definition — borderless, topmost, 68×68 start size |
| `RevitPlugin/.../UI/GleanFabWidget.xaml.cs` | STA thread lifecycle, WebView2 init, dynamic resize via postMessage |
| `widget.html` | Minimal host page for `<glean-helper>` — shadow DOM style overrides + MutationObserver resize bridge |
| `server/src/routes/chat.ts` | Express route — routes to Agent API or generic Chat API based on `agentId` |
| `server/src/appScopes.ts` | Registered app IDs and their Glean scope filters |
