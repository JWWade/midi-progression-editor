public class ProgressionAnalyzerTests
{
    // ── Motion ───────────────────────────────────────────────────────────────

    [Fact]
    public void Analyze_CMajorToGMajor_MotionIsThree()
    {
        var chords = ChordRefs("C", "Major", "G", "Major");

        var result = ProgressionAnalyzer.Analyze(chords);

        Assert.Single(result.Steps);
        Assert.Equal(3, result.Steps[0].Motion);
    }

    [Fact]
    public void Analyze_SameChordRepeated_MotionIsZero()
    {
        var chords = ChordRefs("C", "Major", "C", "Major");

        var result = ProgressionAnalyzer.Analyze(chords);

        Assert.Equal(0, result.Steps[0].Motion);
    }

    [Fact]
    public void Analyze_CMajorToFMajor_MotionIsThree()
    {
        // C Major [0,4,7] → F Major sorted [0,5,9]
        // Best rotation [0,5,9]: 0+1+2 = 3
        var chords = ChordRefs("C", "Major", "F", "Major");

        var result = ProgressionAnalyzer.Analyze(chords);

        Assert.Equal(3, result.Steps[0].Motion);
    }

    // ── ContinuityScore ───────────────────────────────────────────────────────

    [Fact]
    public void Analyze_CMajorToGMajor_ContinuityScoreIs0Point75()
    {
        // averageMotion = 3, 1 - 3/12 = 0.75
        var chords = ChordRefs("C", "Major", "G", "Major");

        var result = ProgressionAnalyzer.Analyze(chords);

        Assert.Equal(0.75, result.ContinuityScore);
    }

    [Fact]
    public void Analyze_SameChordRepeated_ContinuityScoreIsOne()
    {
        var chords = ChordRefs("C", "Major", "C", "Major");

        var result = ProgressionAnalyzer.Analyze(chords);

        Assert.Equal(1.0, result.ContinuityScore);
    }

    [Fact]
    public void Analyze_SingleChord_ContinuityScoreIsOne()
    {
        var chords = new List<ChordRef> { new() { Root = "C", Quality = "Major" } };

        var result = ProgressionAnalyzer.Analyze(chords);

        Assert.Empty(result.Steps);
        Assert.Equal(1.0, result.ContinuityScore);
    }

    [Fact]
    public void Analyze_ThreeChords_ContinuityScoreIsAverageOfSteps()
    {
        // C→F motion=3, F→G motion=6 → averageMotion=4.5, 1 - 4.5/12 = 0.625
        var chords = ChordRefs("C", "Major", "F", "Major", "G", "Major");

        var result = ProgressionAnalyzer.Analyze(chords);

        Assert.Equal(2, result.Steps.Count);
        Assert.Equal(0.625, result.ContinuityScore, precision: 10);
    }

    // ── TensionTrend ─────────────────────────────────────────────────────────

    [Fact]
    public void Analyze_MajorChords_TensionIsZero()
    {
        // Major chord intervals: major 3rd (IC4), perfect 5th (IC5), minor 3rd (IC3) — all consonant
        var chords = ChordRefs("C", "Major", "G", "Major");

        var result = ProgressionAnalyzer.Analyze(chords);

        Assert.Equal(2, result.TensionTrend.Count);
        Assert.Equal(0.0, result.TensionTrend[0]);
        Assert.Equal(0.0, result.TensionTrend[1]);
    }

    [Fact]
    public void Analyze_DiminishedChord_TensionReflectsTritone()
    {
        // C Diminished [0,3,6]: pairs (0,3)=IC3, (0,6)=IC6 (rough), (3,6)=IC3 → 1/3
        var chords = new List<ChordRef> { new() { Root = "C", Quality = "Diminished" } };

        var result = ProgressionAnalyzer.Analyze(chords);

        Assert.Single(result.TensionTrend);
        Assert.Equal(1.0 / 3.0, result.TensionTrend[0], precision: 10);
    }

    [Fact]
    public void Analyze_Dominant7Chord_TensionReflectsMinor7AndTritone()
    {
        // C Dom7 [0,4,7,10]: pairs → IC4,IC5,IC2(rough),IC3,IC6(rough),IC3 → 2/6 = 1/3
        var chords = new List<ChordRef> { new() { Root = "C", Quality = "Dominant7" } };

        var result = ProgressionAnalyzer.Analyze(chords);

        Assert.Equal(1.0 / 3.0, result.TensionTrend[0], precision: 10);
    }

    // ── Step fields ───────────────────────────────────────────────────────────

    [Fact]
    public void Analyze_CMajorToGMajor_StepFromToIsPreserved()
    {
        var chords = ChordRefs("C", "Major", "G", "Major");

        var result = ProgressionAnalyzer.Analyze(chords);

        var step = result.Steps[0];
        Assert.Equal("C", step.From.Root);
        Assert.Equal("Major", step.From.Quality);
        Assert.Equal("G", step.To.Root);
        Assert.Equal("Major", step.To.Quality);
    }

    // ── Deterministic fixture ─────────────────────────────────────────────────

    [Fact]
    public void Analyze_FixtureProgression_ReturnsExactKnownValues()
    {
        // C Major [0,4,7] → G Major [2,7,11] (sorted)
        // motion = 3 (rotation [11,2,7]: 1+2+0=3)
        // continuityScore = 1 - 3/12 = 0.75
        // tensionTrend = [0.0, 0.0] (both major triads, no rough intervals)
        var chords = ChordRefs("C", "Major", "G", "Major");

        var result = ProgressionAnalyzer.Analyze(chords);

        Assert.Single(result.Steps);
        Assert.Equal(3, result.Steps[0].Motion);
        Assert.Equal(0.75, result.ContinuityScore);
        Assert.Equal([0.0, 0.0], result.TensionTrend);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static List<ChordRef> ChordRefs(params string[] rootsAndQualities)
    {
        var list = new List<ChordRef>();
        for (int i = 0; i < rootsAndQualities.Length; i += 2)
            list.Add(new ChordRef { Root = rootsAndQualities[i], Quality = rootsAndQualities[i + 1] });
        return list;
    }
}
