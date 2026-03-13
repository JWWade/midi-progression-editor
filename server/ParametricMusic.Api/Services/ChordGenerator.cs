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

    /// <summary>
    /// Builds a chord from a root note and quality by applying standard Western tertian harmony
    /// interval patterns above the root, then reducing to pitch classes modulo 12.
    /// </summary>
    /// <remarks>
    /// Each chord quality is defined by the semitone intervals stacked above the root following
    /// standard tonal harmony conventions (e.g. Aldwell &amp; Schachter,
    /// <em>Harmony and Voice Leading</em>, 4th ed., 2010):
    /// <list type="bullet">
    ///   <item>Major triad — root, major 3rd (4 st), perfect 5th (7 st)</item>
    ///   <item>Minor triad — root, minor 3rd (3 st), perfect 5th (7 st)</item>
    ///   <item>Diminished triad — root, minor 3rd (3 st), diminished 5th (6 st)</item>
    ///   <item>Augmented triad — root, major 3rd (4 st), augmented 5th (8 st)</item>
    ///   <item>Dominant 7th — major triad + minor 7th (10 st)</item>
    ///   <item>Major 7th — major triad + major 7th (11 st)</item>
    ///   <item>Minor 7th — minor triad + minor 7th (10 st)</item>
    ///   <item>Half-Diminished 7th — diminished triad + minor 7th (10 st)</item>
    /// </list>
    /// </remarks>
    /// <param name="root">The root note of the chord.</param>
    /// <param name="quality">The chord quality, determining the interval stack.</param>
    /// <returns>
    /// A <see cref="ChordDto"/> containing the root name, quality, display name, pitch classes,
    /// and note names for the chord tones.
    /// </returns>
    /// <exception cref="ArgumentOutOfRangeException">
    /// Thrown when <paramref name="quality"/> is not a supported <see cref="ChordQuality"/> value.
    /// </exception>
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
