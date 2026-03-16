using System.Text.Json.Serialization;

namespace ParametricMusic.Api.Models;

/// <summary>
/// Metadata describing the diatonic quartal context of a chord.
/// </summary>
public class QuartalMetadata
{
    [JsonPropertyName("isDiatonic")]
    public bool IsDiatonic { get; init; } = true;

    [JsonPropertyName("scaleRoot")]
    public string ScaleRoot { get; init; } = string.Empty;

    [JsonPropertyName("scaleType")]
    public string ScaleType { get; init; } = string.Empty;

    /// <summary>Scale degree (1-indexed, 1..7).</summary>
    [JsonPropertyName("degree")]
    public int Degree { get; init; }

    /// <summary>Number of voices in the quartal stack (default 3).</summary>
    [JsonPropertyName("size")]
    public int Size { get; init; } = 3;
}

/// <summary>
/// Data transfer object for a diatonic quartal chord, extending the standard
/// chord fields with quartal-specific metadata.
/// </summary>
public class QuartalChordDto
{
    [JsonPropertyName("root")]
    public string Root { get; init; } = string.Empty;

    [JsonPropertyName("quality")]
    public string Quality { get; init; } = "Quartal";

    [JsonPropertyName("displayName")]
    public string DisplayName { get; init; } = string.Empty;

    [JsonPropertyName("pitchClasses")]
    public int[] PitchClasses { get; init; } = [];

    [JsonPropertyName("noteNames")]
    public string[] NoteNames { get; init; } = [];

    [JsonPropertyName("quartal")]
    public QuartalMetadata Quartal { get; init; } = new();
}
