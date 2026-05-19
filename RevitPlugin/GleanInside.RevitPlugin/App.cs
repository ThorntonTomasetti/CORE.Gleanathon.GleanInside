using Autodesk.Revit.UI;
using GleanInside.RevitPlugin.UI;

namespace GleanInside.RevitPlugin
{
    public class App : IExternalApplication
    {
        internal static readonly DockablePaneId PaneId =
            new DockablePaneId(new System.Guid("A1B2C3D4-E5F6-7890-ABCD-EF1234567890"));

        public Result OnStartup(UIControlledApplication app)
        {
            app.RegisterDockablePane(PaneId, "Glean AI Assistant", new ChatDockablePaneProvider());

            var ribbon = app.CreateRibbonTab("Glean");
            var panel = app.CreateRibbonPanel("Glean", "AI Assistant");

            var buttonData = new PushButtonData(
                "OpenGleanChat",
                "Open Chat",
                typeof(App).Assembly.Location,
                typeof(Commands.OpenChatCommand).FullName);

            panel.AddItem(buttonData);

            return Result.Succeeded;
        }

        public Result OnShutdown(UIControlledApplication app) => Result.Succeeded;
    }
}
