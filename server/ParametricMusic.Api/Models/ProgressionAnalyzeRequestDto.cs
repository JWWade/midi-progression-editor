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
    [Required]
    [StringLength(16, MinimumLength = 1)]
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
