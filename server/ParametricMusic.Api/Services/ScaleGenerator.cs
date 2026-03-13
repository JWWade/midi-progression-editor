using ParametricMusic.Api.Models;

namespace ParametricMusic.Api.Services;

public static class ScaleGenerator
{
    private static readonly Dictionary<ScaleType, int[]> ScaleIntervals = new()
    {
        [ScaleType.Major]         = [0, 2, 4, 5, 7, 9, 11],
        [ScaleType.NaturalMinor]  = [0, 2, 3, 5, 7, 8, 10],
        [ScaleType.HarmonicMinor] = [0, 2, 3, 5, 7, 8, 11],
        [ScaleType.MelodicMinor]  = [0, 2, 3, 5, 7, 9, 11],
        [ScaleType.Dorian]        = [0, 2, 3, 5, 7, 9, 10],
        [ScaleType.Phrygian]      = [0, 1, 3, 5, 7, 8, 10],
        [ScaleType.Lydian]        = [0, 2, 4, 6, 7, 9, 11],
        [ScaleType.Mixolydian]    = [0, 2, 4, 5, 7, 9, 10],
    };

    /// <summary>
    /// Builds a scale from a root pitch-class index and scale type by applying the corresponding
    /// diatonic or modal interval pattern, reducing each tone to a pitch class modulo 12.
    /// </summary>
    /// <remarks>
    /// Scale tones are derived by adding the semitone intervals for the given mode above the root,
    /// following the standard Western diatonic and modal system (Levine,
    /// <em>The Jazz Theory Book</em>, 1995; Aldwell &amp; Schachter,
    /// <em>Harmony and Voice Leading</em>, 4th ed., 2010):
    /// <list type="bullet">
    ///   <item>Major (Ionian) — W-W-H-W-W-W-H → [0, 2, 4, 5, 7, 9, 11]</item>
    ///   <item>Natural Minor (Aeolian) — W-H-W-W-H-W-W → [0, 2, 3, 5, 7, 8, 10]</item>
    ///   <item>Harmonic Minor — natural minor with raised 7th → [0, 2, 3, 5, 7, 8, 11]</item>
    ///   <item>Melodic Minor (ascending) — natural minor with raised 6th and 7th → [0, 2, 3, 5, 7, 9, 11]</item>
    ///   <item>Dorian — W-H-W-W-W-H-W → [0, 2, 3, 5, 7, 9, 10]</item>
    ///   <item>Phrygian — H-W-W-W-H-W-W → [0, 1, 3, 5, 7, 8, 10]</item>
    ///   <item>Lydian — W-W-W-H-W-W-H → [0, 2, 4, 6, 7, 9, 11]</item>
    ///   <item>Mixolydian — W-W-H-W-W-H-W → [0, 2, 4, 5, 7, 9, 10]</item>
    /// </list>
    /// The church modes (Dorian through Mixolydian) are cyclic rotations of the major-scale
    /// interval pattern starting on different scale degrees.
    /// </remarks>
    /// <param name="root">The root pitch-class index (0 = C, 1 = C♯/D♭, …, 11 = B).</param>
    /// <param name="scaleType">The scale type, selecting the interval pattern to apply.</param>
    /// <returns>
    /// An array of <see cref="NoteInfo"/> values representing the scale tones in ascending order.
    /// </returns>
    /// <exception cref="ArgumentOutOfRangeException">
    /// Thrown when <paramref name="scaleType"/> is not a supported <see cref="ScaleType"/> value.
    /// </exception>
    public static NoteInfo[] BuildScale(int root, ScaleType scaleType)
    {
        if (!ScaleIntervals.TryGetValue(scaleType, out var intervals))
            throw new ArgumentOutOfRangeException(nameof(scaleType), scaleType, "Unsupported scale type.");
        return intervals
            .Select(interval =>
            {
                var noteIndex = (root + interval) % 12;
                var note = (Note)noteIndex;
                return new NoteInfo(noteIndex, note.GetDisplayName());
            })
            .ToArray();
    }
}
