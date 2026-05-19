using Autodesk.Revit.UI;

namespace GleanInside.RevitPlugin.UI
{
    public class ChatDockablePaneProvider : IDockablePaneProvider
    {
        public void SetupDockablePane(DockablePaneProviderData data)
        {
            data.FrameworkElement = new ChatDockablePane();
            data.InitialState = new DockablePaneState
            {
                DockPosition = DockPosition.Right,
                MinimumWidth = 360,
                MinimumHeight = 480,
            };
        }
    }
}
