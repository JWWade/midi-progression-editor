using ParametricMusic.Api.Models;

namespace ParametricMusic.Api.Services;

/// <summary>
/// Builds tertian chords from a root note and quality by applying standard Western interval patterns.
/// </summary>
/// <remarks>
/// Implements <see cref="IChordService"/> for use with dependency injection.
/// The underlying interval tables are exposed as <c>internal static</c> members so that
/// <see cref="ProgressionAnalyzer"/> can resolve pitch classes without a second DI hop.
/// </remarks>
public class ChordGenerator : IChordService
{
    internal static readonly Dictionary<ChordQuality, int[]> Intervals = new()
    {
        [ChordQuality.Major]           = [0, 4, 7],
        [ChordQuality.Minor]           = [0, 3, 7],
        [ChordQuality.Diminished]      = [0, 3, 6],
        [ChordQuality.Augmented]       = [0, 4, 8],
        [ChordQuality.Sus2]            = [0, 2, 7],
        [ChordQuality.Major6]          = [0, 4, 7, 9],
        [ChordQuality.Minor6]          = [0, 3, 7, 9],
        [ChordQuality.Dominant7]       = [0, 4, 7, 10],
        [ChordQuality.Dom7Sus4]        = [0, 5, 7, 10],
        [ChordQuality.Major7]          = [0, 4, 7, 11],
        [ChordQuality.Minor7]          = [0, 3, 7, 10],
        [ChordQuality.HalfDiminished7] = [0, 3, 6, 10],
        [ChordQuality.Quartal]         = [0, 5, 10],
    };

    private static readonly Dictionary<ChordQuality, string> QualityDisplayNames = new()
    {
        [ChordQuality.Major]           = "Major",
        [ChordQuality.Minor]           = "Minor",
        [ChordQuality.Diminished]      = "Diminished",
        [ChordQuality.Augmented]       = "Augmented",
        [ChordQuality.Sus2]            = "Sus 2",
        [ChordQuality.Major6]          = "Major 6",
        [ChordQuality.Minor6]          = "Minor 6",
        [ChordQuality.Dominant7]       = "Dominant 7th",
        [ChordQuality.Dom7Sus4]        = "Dom 7 Sus4",
        [ChordQuality.Major7]          = "Major 7th",
        [ChordQuality.Minor7]          = "Minor 7th",
        [ChordQuality.HalfDiminished7] = "Half-Diminished 7th",
        [ChordQuality.Quartal]         = "Quartal",
    };

    /// <inheritdoc />
    public ChordDto BuildChord(Note root, ChordQuality quality)
    {
        if (!Intervals.TryGetValue(quality, out var intervals))
            throw new ArgumentOutOfRangeException(nameof(quality), $"Unsupported chord quality: {quality}");

        var rootIndex = (int)root;
        var rootName = root.GetDisplayName();

        var pitchClasses = intervals
            .Select(interval => (rootIndex + interval) % 12)
            .ToArray();

        var noteNames = pitchClasses
            .Select(pc => ((Note)pc).GetDisplayName())
            .ToArray();

        var qualityLabel = QualityDisplayNames[quality];

        return new ChordDto
        {
            Root        = rootName,
            Quality     = quality,
            DisplayName = $"{rootName} {qualityLabel}",
            PitchClasses = pitchClasses,
            NoteNames   = noteNames,
        };
    }
}
