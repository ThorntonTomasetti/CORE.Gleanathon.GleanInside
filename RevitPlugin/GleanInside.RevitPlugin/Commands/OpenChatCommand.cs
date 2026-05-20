using Autodesk.Revit.Attributes;
using Autodesk.Revit.DB;
using Autodesk.Revit.UI;
using GleanInside.RevitPlugin.UI;

namespace GleanInside.RevitPlugin.Commands
{
    [Transaction(TransactionMode.ReadOnly)]
    public class OpenChatCommand : IExternalCommand
    {
        public Result Execute(ExternalCommandData commandData, ref string message, ElementSet elements)
        {
            GleanFabWidget.EnsureVisible();
            RevitContextHelper.PushToWidget(commandData.Application);
            return Result.Succeeded;
        }
    }
}
