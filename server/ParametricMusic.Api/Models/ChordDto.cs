using System.Text.Json.Serialization;

namespace ParametricMusic.Api.Models;

public class ChordDto
{
    [JsonPropertyName("root")]
    public string Root { get; init; } = string.Empty;

    [JsonPropertyName("quality")]
    public ChordQuality Quality { get; init; }

    [JsonPropertyName("displayName")]
    public string DisplayName { get; init; } = string.Empty;

    [JsonPropertyName("pitchClasses")]
    public int[] PitchClasses { get; init; } = [];

    [JsonPropertyName("noteNames")]
    public string[] NoteNames { get; init; } = [];
}
