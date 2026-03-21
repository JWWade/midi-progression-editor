using System.Text.Json.Serialization;

namespace ParametricMusic.Api.Models;

public class NoteInfo
{
    [JsonPropertyName("index")]
    public int Index { get; init; }

    [JsonPropertyName("name")]
    public string Name { get; init; } = string.Empty;

    public NoteInfo(int index, string name)
    {
        Index = index;
        Name = name;
    }
}
