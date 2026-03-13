using System.Text.Json.Serialization;

namespace ParametricMusic.Api.Models;

public class HealthResponse
{
    [JsonPropertyName("status")]
    public string Status { get; init; } = string.Empty;

    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; init; }
}
