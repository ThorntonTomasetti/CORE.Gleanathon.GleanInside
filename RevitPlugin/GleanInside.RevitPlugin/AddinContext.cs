using System.Collections.Concurrent;
using System.Collections.Generic;

namespace GleanInside.RevitPlugin
{
    /// <summary>
    /// Thread-safe registry for addin-specific context that gets sent to the
    /// Glean chat widget alongside Revit API context. Addins set/clear entries
    /// as their UI state changes — the widget always gets the latest snapshot.
    /// </summary>
    public static class AddinContext
    {
        private static readonly ConcurrentDictionary<string, string> _entries = new();

        /// <summary>Set a context entry. Overwrites if the key already exists.</summary>
        public static void Set(string key, string value) => _entries[key] = value;

        /// <summary>Remove a context entry.</summary>
        public static void Clear(string key) => _entries.TryRemove(key, out _);

        /// <summary>Remove all context entries.</summary>
        public static void ClearAll() => _entries.Clear();

        /// <summary>Returns a snapshot of all current entries.</summary>
        internal static Dictionary<string, string> Snapshot()
        {
            return new Dictionary<string, string>(_entries);
        }
    }
}
