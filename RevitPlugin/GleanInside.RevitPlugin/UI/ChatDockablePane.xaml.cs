using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.Wpf;
using System;
using System.IO;
using System.Text.Json;
using System.Windows.Controls;

namespace GleanInside.RevitPlugin.UI
{
    public partial class ChatDockablePane : UserControl
    {
        // Change to your hosted URL in production, or keep pointing at the local dev server.
        private const string WidgetUrl = "http://localhost:5173";

        public ChatDockablePane()
        {
            InitializeComponent();
            InitializeWebViewAsync();
        }

        private async void InitializeWebViewAsync()
        {
            // WebView2 needs a writable user data folder — use %APPDATA%\GleanInside
            var userDataFolder = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "GleanInside", "WebView2");

            var env = await CoreWebView2Environment.CreateAsync(null, userDataFolder);
            await WebView.EnsureCoreWebView2Async(env);

            WebView.CoreWebView2.WebMessageReceived += OnWebMessageReceived;
            WebView.Source = new Uri(WidgetUrl);
        }

        private void WebView_NavigationCompleted(object sender, CoreWebView2NavigationCompletedEventArgs e)
        {
            LoadingOverlay.Visibility = System.Windows.Visibility.Collapsed;
        }

        /// <summary>
        /// Call this from anywhere in the plugin to push Revit context into the widget.
        /// The widget receives it as a window message: { type: "revit-context", payload: { ... } }
        /// </summary>
        public void SendRevitContext(object payload)
        {
            if (WebView.CoreWebView2 == null) return;

            var msg = JsonSerializer.Serialize(new
            {
                type = "revit-context",
                payload
            });
            WebView.CoreWebView2.PostWebMessageAsString(msg);
        }

        private void OnWebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            // Handle messages posted from the widget via window.chrome.webview.postMessage(...)
            var raw = e.TryGetWebMessageAsString();
            // Extend here: parse and dispatch to Revit API as needed
        }
    }
}
