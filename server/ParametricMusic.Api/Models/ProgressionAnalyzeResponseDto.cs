using System.Text.Json.Serialization;

namespace ParametricMusic.Api.Models;

/// <summary>
/// Represents a single voice-leading step between two consecutive chords in a progression.
/// </summary>
public class ProgressionStep
{
    /// <summary>Source chord of this step.</summary>
    [JsonPropertyName("from")]
    public ChordRef From { get; init; } = new();

    /// <summary>Destination chord of this step.</summary>
    [JsonPropertyName("to")]
    public ChordRef To { get; init; } = new();

    /// <summary>
    /// Voice-leading motion score for this step: the sum of the minimal pitch-class
    /// distances from each note in <see cref="From"/> to its nearest neighbour in
    /// <see cref="To"/>. Lower values indicate smoother voice leading.
    /// </summary>
    [JsonPropertyName("motion")]
    public int Motion { get; init; }
}

/// <summary>
/// Data transfer object for the response from <c>POST /progression/analyze</c>.
/// Contains per-step voice-leading analysis and aggregate metrics.
/// </summary>
public class ProgressionAnalyzeResponseDto
{
    /// <summary>
    /// Ordered list of voice-leading steps, one per consecutive chord pair.
    /// A progression of N chords produces N-1 steps.
    /// </summary>
    [JsonPropertyName("steps")]
    public List<ProgressionStep> Steps { get; init; } = [];

    /// <summary>
    /// Aggregate continuity score in the range [0, 1].
    /// Computed as <c>1.0 – (averageMotion / 12.0)</c>.
    /// A score near 1.0 indicates smooth, minimal voice leading throughout the progression;
    /// a score near 0.0 indicates large average motion between consecutive chords.
    /// </summary>
    [JsonPropertyName("continuityScore")]
    public double ContinuityScore { get; init; }

    /// <summary>
    /// Per-chord harmonic tension values in the range [0, 1], one entry per chord.
    /// Higher values indicate greater harmonic tension (more dissonance or distance
    /// from a hypothetical tonic). The array length equals the number of input chords.
    /// </summary>
    [JsonPropertyName("tensionTrend")]
    public List<double> TensionTrend { get; init; } = [];
}
