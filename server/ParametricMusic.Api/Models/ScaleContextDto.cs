using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ParametricMusic.Api.Models;

/// <summary>
/// Identifies a diatonic context for scale-aware chord analysis:
/// a root pitch-class (0–11) and a scale mode.
///
/// Mirrors the frontend <c>ScaleContext</c> type
/// (<c>client/src/shared/types/ScaleContext.ts</c>).
/// </summary>
public class ScaleContextDto
{
    /// <summary>Root pitch-class (0 = C, 1 = C♯/D♭, …, 11 = B).</summary>
    [JsonPropertyName("root")]
    [Range(0, 11, ErrorMessage = "Root must be a pitch-class between 0 and 11.")]
    public int Root { get; set; }

    /// <summary>Scale mode used to resolve diatonic membership.</summary>
    [JsonPropertyName("mode")]
    public ScaleType Mode { get; set; } = ScaleType.Major;
}
