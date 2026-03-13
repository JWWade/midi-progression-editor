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
