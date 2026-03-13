using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ParametricMusic.Api.Models;

public class ChordFromRootRequestDto
{
    [JsonPropertyName("quality")]
    [Display(Name = "Chord Quality", Description = "The quality of the chord to build")]
    public ChordQuality Quality { get; set; } = ChordQuality.Major;
}
