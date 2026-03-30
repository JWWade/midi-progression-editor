using System.Text.Json.Serialization;

namespace ParametricMusic.Api.Models;

/// <summary>
/// Data transfer object representing a fully resolved chord returned by the harmony engine.
/// </summary>
public class ChordDto
{
    /// <summary>Root note name (e.g. "C", "F#").</summary>
    [JsonPropertyName("root")]
    public string Root { get; init; } = string.Empty;

    /// <summary>Chord quality (e.g. <see cref="ChordQuality.Major"/>, <see cref="ChordQuality.Minor7"/>).</summary>
    [JsonPropertyName("quality")]
    public ChordQuality Quality { get; init; }

    /// <summary>Human-readable chord name combining root and quality (e.g. "C Major", "F# Minor 7th").</summary>
    [JsonPropertyName("displayName")]
    public string DisplayName { get; init; } = string.Empty;

    /// <summary>
    /// Pitch-class integers (0–11) for each note in the chord, ordered from root upward.
    /// C = 0, C♯/D♭ = 1, … B = 11.
    /// </summary>
    [JsonPropertyName("pitchClasses")]
    public int[] PitchClasses { get; init; } = [];

    /// <summary>Note name strings corresponding to each element of <see cref="PitchClasses"/> (e.g. ["C", "E", "G"]).</summary>
    [JsonPropertyName("noteNames")]
    public string[] NoteNames { get; init; } = [];
}
