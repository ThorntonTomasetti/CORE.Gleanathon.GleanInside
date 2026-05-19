using Autodesk.Revit.UI;

namespace GleanInside.RevitPlugin
{
    public class App : IExternalApplication
    {
        public Result OnStartup(UIControlledApplication app)
        {
            var panel = app.CreateRibbonPanel("Glean AI");

            var buttonData = new PushButtonData(
                "OpenGleanChat",
                "Glean Chat",
                typeof(App).Assembly.Location,
                typeof(Commands.OpenChatCommand).FullName);

            panel.AddItem(buttonData);

            return Result.Succeeded;
        }

        public Result OnShutdown(UIControlledApplication app) => Result.Succeeded;
    }
}
