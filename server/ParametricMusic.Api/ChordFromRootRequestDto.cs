using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

public class ChordFromRootRequestDto
{
    [JsonPropertyName("quality")]
    [Display(Name = "Chord Quality", Description = "The quality of the chord to build")]
    public ChordQuality Quality { get; set; } = ChordQuality.Major;

    [JsonPropertyName("primitiveShape")]
    public PrimitiveShape? PrimitiveShape { get; set; }
}
