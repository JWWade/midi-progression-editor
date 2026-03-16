using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ParametricMusic.Api.Models;

/// <summary>
/// Request body for building a diatonic quartal chord from a scale root,
/// scale type, and scale degree.
/// </summary>
public class DiatonicQuartalRequestDto
{
    [JsonPropertyName("scaleType")]
    [Display(Name = "Scale Type", Description = "The scale type to derive diatonic fourths from")]
    public ScaleType ScaleType { get; set; } = ScaleType.Major;

    /// <summary>Scale degree index, 1-based (1..7).</summary>
    [JsonPropertyName("degree")]
    [Range(1, 7, ErrorMessage = "Degree must be between 1 and 7.")]
    [Display(Name = "Scale Degree", Description = "The scale degree (1–7) on which to build the quartal chord")]
    public int Degree { get; set; } = 1;

    /// <summary>Number of voices to stack (default 3).</summary>
    [JsonPropertyName("size")]
    [Range(2, 7, ErrorMessage = "Size must be between 2 and 7.")]
    [Display(Name = "Stack Size", Description = "Number of voices in the quartal stack (2–7, default 3)")]
    public int Size { get; set; } = 3;
}
