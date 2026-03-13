using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ParametricMusic.Api.Models;

public class ScaleOptionsDto
{
    [JsonPropertyName("scaleType")]
    [Display(Name = "Scale Type", Description = "The type of scale to generate")]
    public ScaleType ScaleType { get; set; } = ScaleType.Major;
}
