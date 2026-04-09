using System.Text.Json;
using System.Text.Json.Serialization;

namespace ParametricMusic.Api.Models;

/// <summary>
/// JSON converter for <see cref="ChordQuality"/> that accepts both the
/// frontend lowercase shorthand strings (e.g. <c>"major"</c>, <c>"dom7"</c>,
/// <c>"halfdim7"</c>) and the PascalCase enum names used in Swagger/tests
/// (e.g. <c>"Major"</c>, <c>"Dominant7"</c>).
/// </summary>
/// <remarks>
/// The frontend <c>ChordType</c> strings differ from the backend enum names
/// (e.g. <c>"dim"</c> → <see cref="ChordQuality.Diminished"/>).  This
/// converter bridges the two representations so that the OpenAPI schema can
/// expose a proper enum type while remaining compatible with the existing
/// frontend serialisation contract.
/// Serialisation always writes the PascalCase enum name.
/// </remarks>
public sealed class ChordQualityJsonConverter : JsonConverter<ChordQuality>
{
    private static readonly Dictionary<string, ChordQuality> Map =
        new(StringComparer.OrdinalIgnoreCase)
        {
            // Frontend lowercase shorthands
            ["major"]     = ChordQuality.Major,
            ["minor"]     = ChordQuality.Minor,
            ["dim"]       = ChordQuality.Diminished,
            ["aug"]       = ChordQuality.Augmented,
            ["dom7"]      = ChordQuality.Dominant7,
            ["dom7sus4"]  = ChordQuality.Dom7Sus4,
            ["maj7"]      = ChordQuality.Major7,
            ["min7"]      = ChordQuality.Minor7,
            ["halfdim7"]  = ChordQuality.HalfDiminished7,
            ["quartal"]   = ChordQuality.Quartal,
            // PascalCase enum names (Swagger, tests, round-trip)
            ["Major"]           = ChordQuality.Major,
            ["Minor"]           = ChordQuality.Minor,
            ["Diminished"]      = ChordQuality.Diminished,
            ["Augmented"]       = ChordQuality.Augmented,
            ["Dominant7"]       = ChordQuality.Dominant7,
            ["Dom7Sus4"]        = ChordQuality.Dom7Sus4,
            ["Major7"]          = ChordQuality.Major7,
            ["Minor7"]          = ChordQuality.Minor7,
            ["HalfDiminished7"] = ChordQuality.HalfDiminished7,
            ["Quartal"]         = ChordQuality.Quartal,
        };

    // Collect the canonical set of accepted values for the error message:
    // frontend lowercase shorthands only (exclude the PascalCase duplicates).
    private static readonly string AcceptedValues =
        string.Join(", ", Map.Keys.Where(k => k == k.ToLowerInvariant()));

    /// <inheritdoc />
    public override ChordQuality Read(
        ref Utf8JsonReader reader,
        Type typeToConvert,
        JsonSerializerOptions options)
    {
        var str = reader.GetString();
        if (str is not null && Map.TryGetValue(str, out var quality))
            return quality;

        throw new JsonException(
            $"Unknown chord quality: \"{str}\". " +
            $"Accepted values: {AcceptedValues}");
    }

    /// <inheritdoc />
    public override void Write(
        Utf8JsonWriter writer,
        ChordQuality value,
        JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString());
    }
}
