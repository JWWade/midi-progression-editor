using ParametricMusic.Api.Models;

namespace ParametricMusic.Api.Services;

public static class ChordGenerator
{
    private static readonly Dictionary<ChordQuality, int[]> Intervals = new()
    {
        [ChordQuality.Major]           = [0, 4, 7],
        [ChordQuality.Minor]           = [0, 3, 7],
        [ChordQuality.Diminished]      = [0, 3, 6],
        [ChordQuality.Augmented]       = [0, 4, 8],
        [ChordQuality.Dominant7]       = [0, 4, 7, 10],
        [ChordQuality.Major7]          = [0, 4, 7, 11],
        [ChordQuality.Minor7]          = [0, 3, 7, 10],
        [ChordQuality.HalfDiminished7] = [0, 3, 6, 10],
    };

    private static readonly Dictionary<ChordQuality, string> QualityDisplayNames = new()
    {
        [ChordQuality.Major]           = "Major",
        [ChordQuality.Minor]           = "Minor",
        [ChordQuality.Diminished]      = "Diminished",
        [ChordQuality.Augmented]       = "Augmented",
        [ChordQuality.Dominant7]       = "Dominant 7th",
        [ChordQuality.Major7]          = "Major 7th",
        [ChordQuality.Minor7]          = "Minor 7th",
        [ChordQuality.HalfDiminished7] = "Half-Diminished 7th",
    };

    public static ChordDto BuildChord(Note root, ChordQuality quality)
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
