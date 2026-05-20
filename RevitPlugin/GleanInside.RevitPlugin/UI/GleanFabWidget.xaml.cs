using Microsoft.Web.WebView2.Core;
using System;
using System.IO;
using System.Text.Json;
using System.Threading;
using System.Windows;
using System.Windows.Interop;
using System.Windows.Threading;

namespace GleanInside.RevitPlugin.UI
{
    public partial class GleanFabWidget : Window
    {
        // Point at widget.html served by Vite dev server. Pass your agent ID as a query param.
        private const string WidgetUrl = "http://localhost:3000/widget.html?agentId=YOUR_AGENT_ID";

        private const double ClosedWidth = 68;
        private const double ClosedHeight = 68;
        private const double OpenWidth = 370;
        private const double OpenHeight = 542;

        private static GleanFabWidget? _instance;
        private static Thread? _fabThread;
        private static Dispatcher? _fabDispatcher;

        public static void EnsureVisible()
        {
            if (_fabThread != null && _fabThread.IsAlive)
            {
                _fabDispatcher?.Invoke(() =>
                {
                    if (_instance != null && !_instance.IsVisible)
                        _instance.Show();
                });
                return;
            }

            var revitHwnd = System.Diagnostics.Process.GetCurrentProcess().MainWindowHandle;

            _fabThread = new Thread(() =>
            {
                _instance = new GleanFabWidget();
                if (revitHwnd != IntPtr.Zero)
                    new WindowInteropHelper(_instance).Owner = revitHwnd;
                _instance.Show();
                _fabDispatcher = Dispatcher.CurrentDispatcher;
                Dispatcher.Run();
            });
            _fabThread.SetApartmentState(ApartmentState.STA);
            _fabThread.IsBackground = true;
            _fabThread.Start();
        }

        public static void HideInstance()
        {
            _fabDispatcher?.Invoke(() => _instance?.Hide());
        }

        public GleanFabWidget()
        {
            InitializeComponent();
            AnchorBottomRight(ClosedWidth, ClosedHeight);
            Loaded += (_, __) => InitializeWebViewAsync();
        }

        private void AnchorBottomRight(double w, double h)
        {
            var workArea = SystemParameters.WorkArea;
            Width = w;
            Height = h;
            Left = workArea.Right - w - 20;
            Top = workArea.Bottom - h - 70;
        }

        private async void InitializeWebViewAsync()
        {
            try
            {
                var userDataFolder = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                    "GleanInside", "WebView2");

                var env = await CoreWebView2Environment.CreateAsync(null, userDataFolder);
                await WebView.EnsureCoreWebView2Async(env);
                WebView.DefaultBackgroundColor = System.Drawing.Color.Transparent;
                WebView.CoreWebView2.WebMessageReceived += OnWebMessageReceived;
                WebView.Source = new Uri(WidgetUrl);
            }
            catch (Exception ex)
            {
                LoadingOverlay.Dispatcher.Invoke(() =>
                {
                    if (LoadingOverlay.Child is System.Windows.Controls.TextBlock tb)
                        tb.Text = $"WebView2 failed to load:\n{ex.Message}";
                });
            }
        }

        private void OnWebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            try
            {
                var msg = JsonSerializer.Deserialize<JsonElement>(e.TryGetWebMessageAsString());
                if (msg.GetProperty("type").GetString() == "widget-state")
                {
                    bool isOpen = msg.GetProperty("open").GetBoolean();
                    if (isOpen)
                        AnchorBottomRight(OpenWidth, OpenHeight);
                    else
                        AnchorBottomRight(ClosedWidth, ClosedHeight);
                }
            }
            catch { }
        }

        private void WebView_NavigationCompleted(object sender, CoreWebView2NavigationCompletedEventArgs e)
        {
            LoadingOverlay.Visibility = Visibility.Collapsed;
        }
    }
}
