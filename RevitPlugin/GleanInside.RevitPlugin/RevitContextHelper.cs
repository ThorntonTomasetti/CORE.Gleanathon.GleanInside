using Autodesk.Revit.DB;
using Autodesk.Revit.UI;
using System.Collections.Generic;
using System.Linq;

namespace GleanInside.RevitPlugin
{
    public static class RevitContextHelper
    {
        public static void PushToWidget(UIApplication uiApp)
        {
            var uiDoc = uiApp.ActiveUIDocument;
            if (uiDoc == null) return;

            var doc = uiDoc.Document;
            var view = doc.ActiveView;

            // Start with addin-registered context
            var metadata = AddinContext.Snapshot();

            // Layer on Revit API context
            metadata["documentTitle"] = doc.Title ?? "";
            metadata["documentPath"] = doc.PathName ?? "(not saved)";

            var selected = uiDoc.Selection.GetElementIds();
            if (selected.Count > 0)
            {
                var categories = selected
                    .Select(id => doc.GetElement(id))
                    .Where(e => e != null)
                    .GroupBy(e => e.Category?.Name ?? "Unknown")
                    .Select(g => $"{g.Key}: {g.Count()}")
                    .ToList();

                metadata["selectedElements"] = $"{selected.Count} ({string.Join(", ", categories)})";
            }

            var viewName = view != null ? $"{view.ViewType} - {view.Name}" : null;

            UI.GleanFabWidget.SendContext(
                activeView: viewName,
                pageTitle: doc.Title,
                metadata: metadata
            );
        }
    }
}
