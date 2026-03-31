using System.Text.Json.Serialization;

namespace ParametricMusic.Api.Models;

/// <summary>
/// Represents a single note within a scale or chord, carrying both its
/// pitch-class index and its display name.
/// </summary>
public class NoteInfo
{
    /// <summary>
    /// Pitch-class index in the range 0–11 (C = 0, C♯/D♭ = 1, … B = 11).
    /// Values are always within the standard MIDI octave-independent range.
    /// </summary>
    [JsonPropertyName("index")]
    public int Index { get; init; }

    /// <summary>Human-readable note name, using sharp or flat notation as appropriate (e.g. "C", "F#", "Bb").</summary>
    [JsonPropertyName("name")]
    public string Name { get; init; } = string.Empty;

    public NoteInfo(int index, string name)
    {
        Index = index;
        Name = name;
    }
}
