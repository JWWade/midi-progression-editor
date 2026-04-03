using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ParametricMusic.Api.Models;

/// <summary>
/// A chord reference used as input to the progression analyzer.
/// Identifies a chord either by its named root + quality or by an explicit
/// set of pitch classes (for custom / non-tertian chords).
/// </summary>
public class ChordRef : IValidatableObject
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
    /// Values must be in the inclusive range 0–11 and duplicates are not allowed.
    /// </summary>
    [JsonPropertyName("customNotes")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [MaxLength(12, ErrorMessage = "customNotes must not exceed 12 pitch classes.")]
    public int[]? CustomNotes { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (CustomNotes is null)
            yield break;

        var seen = new HashSet<int>();

        for (int i = 0; i < CustomNotes.Length; i++)
        {
            var pitchClass = CustomNotes[i];
            if (pitchClass is < 0 or > 11)
            {
                yield return new ValidationResult(
                    $"customNotes[{i}] must be between 0 and 11.",
                    [nameof(CustomNotes)]);
                continue;
            }

            if (!seen.Add(pitchClass))
            {
                yield return new ValidationResult(
                    $"customNotes contains duplicate value {pitchClass}.",
                    [nameof(CustomNotes)]);
            }
        }
    }
}

public class ProgressionAnalyzeRequestDto
{
    /// <summary>
    /// Ordered list of chords in the progression. Must contain 1–8 chords.
    /// </summary>
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
