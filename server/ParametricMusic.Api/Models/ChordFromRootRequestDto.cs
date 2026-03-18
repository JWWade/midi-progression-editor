using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ParametricMusic.Api.Models;

public class ChordFromRootRequestDto
{
    [JsonPropertyName("quality")]
    [Display(Name = "Chord Quality", Description = "The quality of the chord to build")]
    public ChordQuality Quality { get; set; } = ChordQuality.Major;

    [JsonPropertyName("primitiveShape")]
    [Display(Name = "Primitive Shape", Description = "Optional geometric shape override for the chord polygon")]
    public PrimitiveShape? PrimitiveShape { get; set; }
}
