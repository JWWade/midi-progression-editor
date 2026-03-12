using System.Text.Json.Serialization;

public enum PrimitiveShape
{
    [JsonStringEnumMemberName("equilateral-triangle")]
    EquilateralTriangle,
    [JsonStringEnumMemberName("suspended-triangle")]
    SuspendedTriangle,
    [JsonStringEnumMemberName("square")]
    Square,
    [JsonStringEnumMemberName("rectangle")]
    Rectangle
}
