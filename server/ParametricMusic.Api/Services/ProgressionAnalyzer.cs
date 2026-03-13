using ParametricMusic.Api.Models;

namespace ParametricMusic.Api.Services;

public static class ProgressionAnalyzer
{
    private const double MaxMotionNormalization = 12.0;

    // Rough interval classes: minor 2nd (1), major 2nd (2), tritone (6)
    private static readonly HashSet<int> RoughIntervalClasses = [1, 2, 6];

    public static ProgressionAnalyzeResponseDto Analyze(List<ChordRef> chords)
    {
        var pitchClassSets = chords
            .Select(GetSortedPitchClasses)
            .ToList();

        var steps = new List<ProgressionStep>();
        for (int i = 0; i < chords.Count - 1; i++)
        {
            var motion = ComputeMotion(pitchClassSets[i], pitchClassSets[i + 1]);
            steps.Add(new ProgressionStep
            {
                From = chords[i],
                To = chords[i + 1],
                Motion = motion
            });
        }

        double continuityScore = 1.0;
        if (steps.Count > 0)
        {
            var averageMotion = steps.Average(s => s.Motion);
            continuityScore = Math.Clamp(1.0 - averageMotion / MaxMotionNormalization, 0.0, 1.0);
        }

        var tensionTrend = pitchClassSets.Select(ComputeTension).ToList();

        return new ProgressionAnalyzeResponseDto
        {
            Steps = steps,
            ContinuityScore = continuityScore,
            TensionTrend = tensionTrend
        };
    }

    private static int[] GetSortedPitchClasses(ChordRef chordRef)
    {
        if (!NoteExtensions.TryParse(chordRef.Root, out var note))
            throw new ArgumentException($"Invalid root note: \"{chordRef.Root}\"");

        if (!Enum.TryParse<ChordQuality>(chordRef.Quality, ignoreCase: true, out var quality))
            throw new ArgumentException($"Invalid chord quality: \"{chordRef.Quality}\"");

        var chord = ChordGenerator.BuildChord(note, quality);
        return [.. chord.PitchClasses.Order()];
    }

    // Minimum-cost cyclic matching: try all rotations of the shorter sorted array
    // against the longer and return the rotation that minimises total cyclic distance.
    private static int ComputeMotion(int[] a, int[] b)
    {
        int n = Math.Min(a.Length, b.Length);
        var sortedA = a[..n];
        var sortedB = b[..n];

        int minTotal = int.MaxValue;
        for (int rotation = 0; rotation < n; rotation++)
        {
            int total = 0;
            for (int i = 0; i < n; i++)
            {
                int diff = Math.Abs(sortedA[i] - sortedB[(i + rotation) % n]);
                total += Math.Min(diff, 12 - diff);
            }
            if (total < minTotal)
                minTotal = total;
        }

        return minTotal;
    }

    // Tension: fraction of pitch-class pairs whose interval class is rough (1, 2, or 6).
    private static double ComputeTension(int[] pitchClasses)
    {
        int n = pitchClasses.Length;
        if (n < 2) return 0.0;

        int roughCount = 0;
        int totalPairs = n * (n - 1) / 2;

        for (int i = 0; i < n; i++)
        {
            for (int j = i + 1; j < n; j++)
            {
                int diff = Math.Abs(pitchClasses[i] - pitchClasses[j]);
                int ic = Math.Min(diff, 12 - diff);
                if (RoughIntervalClasses.Contains(ic))
                    roughCount++;
            }
        }

        return (double)roughCount / totalPairs;
    }
}
