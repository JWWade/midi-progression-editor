using System.Text.Json.Serialization;

public class ChordRef
{
    [JsonPropertyName("root")]
    public string Root { get; set; } = string.Empty;

    [JsonPropertyName("quality")]
    public string Quality { get; set; } = string.Empty;

    [JsonPropertyName("primitiveShape")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public PrimitiveShape? PrimitiveShape { get; set; }
}

public class ProgressionAnalyzeRequestDto
{
    [JsonPropertyName("chords")]
    public List<ChordRef> Chords { get; set; } = [];
}
