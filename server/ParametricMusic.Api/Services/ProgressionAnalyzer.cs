using ParametricMusic.Api.Models;

namespace ParametricMusic.Api.Services;

public static class ProgressionAnalyzer
{
    private const double MaxMotionNormalization = 12.0;

    // Rough interval classes: minor 2nd (1), major 2nd (2), tritone (6)
    private static readonly HashSet<int> RoughIntervalClasses = [1, 2, 6];

    /// <summary>
    /// Analyzes a chord progression by computing the voice-leading motion between consecutive
    /// chords, a continuity score derived from average motion, and a per-chord tension trend
    /// based on interval roughness.
    /// </summary>
    /// <param name="chords">
    /// The ordered list of chords in the progression. Must contain at least one chord.
    /// </param>
    /// <returns>
    /// A <see cref="ProgressionAnalyzeResponseDto"/> containing:
    /// <list type="bullet">
    ///   <item><see cref="ProgressionAnalyzeResponseDto.Steps"/> — one entry per consecutive pair.</item>
    ///   <item><see cref="ProgressionAnalyzeResponseDto.ContinuityScore"/> — scalar in [0, 1].</item>
    ///   <item><see cref="ProgressionAnalyzeResponseDto.TensionTrend"/> — one value per chord.</item>
    /// </list>
    /// </returns>
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

    /// <summary>
    /// Resolves the sorted pitch-class array for a chord specified by root note name and quality string.
    /// </summary>
    /// <param name="chordRef">A chord reference containing a root note name and quality label.</param>
    /// <returns>A sorted array of MIDI pitch classes (0–11) for the chord's tones.</returns>
    /// <exception cref="ArgumentException">
    /// Thrown when <paramref name="chordRef"/> contains an unrecognized root or quality value.
    /// </exception>
    private static int[] GetSortedPitchClasses(ChordRef chordRef)
    {
        if (!NoteExtensions.TryParse(chordRef.Root, out var note))
            throw new ArgumentException($"Invalid root note: \"{chordRef.Root}\"");

        if (!Enum.TryParse<ChordQuality>(chordRef.Quality, ignoreCase: true, out var quality))
            throw new ArgumentException($"Invalid chord quality: \"{chordRef.Quality}\"");

        var chord = ChordGenerator.BuildChord(note, quality);
        return [.. chord.PitchClasses.Order()];
    }

    /// <summary>
    /// Computes the voice-leading motion cost between two chords using minimum-cost cyclic matching.
    /// </summary>
    /// <remarks>
    /// The method performs a brute-force search over all <c>n</c> cyclic rotations of the shorter
    /// sorted pitch-class array against the longer, selecting the rotation that minimises the total
    /// semitone displacement. This is a simplified, exhaustive-search form of the optimal
    /// voice-leading assignment problem described in Tymoczko's
    /// <em>A Geometry of Music</em> (Oxford University Press, 2011, ch. 2).
    /// <para>
    /// Each pairwise distance uses the cyclic (interval-class) metric:
    /// <c>min(|a - b|, 12 - |a - b|)</c>, which measures the shortest path around the
    /// chromatic circle rather than raw semitone difference.
    /// </para>
    /// <para>
    /// An alternative approach is the Hungarian algorithm (O(n³)), which solves the full
    /// weighted bipartite assignment problem. For chord sizes of at most 4 notes the
    /// exhaustive rotation search (O(n²)) is equally exact and simpler to implement.
    /// </para>
    /// </remarks>
    /// <param name="a">Sorted pitch-class array for the first chord.</param>
    /// <param name="b">Sorted pitch-class array for the second chord.</param>
    /// <returns>The minimum total cyclic semitone distance across all rotations.</returns>
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

    /// <summary>
    /// Computes a tension value for a chord as the fraction of unique pitch-class pairs whose
    /// interval class is considered acoustically rough.
    /// </summary>
    /// <remarks>
    /// Roughness classification is drawn from the psychoacoustic consonance/dissonance model of
    /// Plomp &amp; Levelt (1965) as applied to pitch-class set theory by Huron (1994).
    /// The interval class of a pair is <c>min(|a - b|, 12 - |a - b|)</c>, collapsing octave
    /// equivalence. Interval classes 1 (minor 2nd / major 7th), 2 (major 2nd / minor 7th), and
    /// 6 (tritone) are treated as rough; all others are treated as smooth.
    /// <para>
    /// The total number of unique pairs is <c>n(n-1)/2</c>, and the returned value is the ratio
    /// of rough pairs to total pairs, yielding a score in [0, 1].
    /// </para>
    /// <para>
    /// An alternative model is Parncutt's (1989) sensory dissonance measure, which weights
    /// interval classes by their harmonic-series overlap rather than applying a binary
    /// rough/smooth classification, producing a smoother continuous dissonance curve.
    /// </para>
    /// </remarks>
    /// <param name="pitchClasses">The pitch-class array for a single chord.</param>
    /// <returns>
    /// A value in [0, 1] where 0 means no rough intervals and 1 means every pair is rough.
    /// </returns>
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
