using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ParametricMusic.Api.Models;

public class ChordRef
{
    [JsonPropertyName("root")]
    [Required]
    [StringLength(8, MinimumLength = 1)]
    public string Root { get; set; } = string.Empty;

    [JsonPropertyName("quality")]
    [JsonConverter(typeof(ChordQualityJsonConverter))]
    public ChordQuality Quality { get; set; } = ChordQuality.Major;

    [JsonPropertyName("primitiveShape")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public PrimitiveShape? PrimitiveShape { get; set; }

    /// <summary>
    /// Optional explicit pitch-class array (values 0–11) for custom chords
    /// that do not map to a named tertian quality.  When present and
    /// non-empty, the analyzer uses these pitch classes directly instead of
    /// deriving them from <see cref="Root"/> and <see cref="Quality"/>.
    /// Out-of-range values are silently discarded.
    /// </summary>
    [JsonPropertyName("customNotes")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int[]? CustomNotes { get; set; }
}

public class ProgressionAnalyzeRequestDto
{
    [JsonPropertyName("chords")]
    public List<ChordRef> Chords { get; set; } = [];

    /// <summary>
    /// Optional diatonic context for scale-aware analysis.
    /// When provided, future analysis passes may incorporate key/mode
    /// information (e.g. harmonic function labeling for ML workflows).
    /// Currently stored on the request but not yet consumed by the analyzer.
    /// </summary>
    [JsonPropertyName("scaleContext")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public ScaleContextDto? ScaleContext { get; set; }
}
