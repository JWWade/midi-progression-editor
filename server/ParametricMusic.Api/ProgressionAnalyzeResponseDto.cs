using System.Text.Json.Serialization;

public class ProgressionStep
{
    [JsonPropertyName("from")]
    public ChordRef From { get; init; } = new();

    [JsonPropertyName("to")]
    public ChordRef To { get; init; } = new();

    [JsonPropertyName("motion")]
    public int Motion { get; init; }
}

public class ProgressionAnalyzeResponseDto
{
    [JsonPropertyName("steps")]
    public List<ProgressionStep> Steps { get; init; } = [];

    [JsonPropertyName("continuityScore")]
    public double ContinuityScore { get; init; }

    [JsonPropertyName("tensionTrend")]
    public List<double> TensionTrend { get; init; } = [];
}
