using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

public class ScaleOptionsDto
{
    [JsonPropertyName("scaleType")]
    [Display(Name = "Scale Type", Description = "The type of scale to generate")]
    public ScaleType ScaleType { get; set; } = ScaleType.Major;
}
