public class ProgressionAnalyzerTests
{
    private readonly IProgressionService _service = new ProgressionAnalyzer();

    // ── Motion ───────────────────────────────────────────────────────────────

    [Fact]
    public void Analyze_CMajorToGMajor_MotionIsThree()
    {
        var chords = ChordRefs("C", "Major", "G", "Major");

        var result = _service.Analyze(chords);

        Assert.Single(result.Steps);
        Assert.Equal(3, result.Steps[0].Motion);
    }

    [Fact]
    public void Analyze_SameChordRepeated_MotionIsZero()
    {
        var chords = ChordRefs("C", "Major", "C", "Major");

        var result = _service.Analyze(chords);

        Assert.Equal(0, result.Steps[0].Motion);
    }

    [Fact]
    public void Analyze_CMajorToFMajor_MotionIsThree()
    {
        // C Major [0,4,7] → F Major sorted [0,5,9]
        // Best rotation [0,5,9]: 0+1+2 = 3
        var chords = ChordRefs("C", "Major", "F", "Major");

        var result = _service.Analyze(chords);

        Assert.Equal(3, result.Steps[0].Motion);
    }

    // ── ContinuityScore ───────────────────────────────────────────────────────

    [Fact]
    public void Analyze_CMajorToGMajor_ContinuityScoreIs0Point75()
    {
        // averageMotion = 3, 1 - 3/12 = 0.75
        var chords = ChordRefs("C", "Major", "G", "Major");

        var result = _service.Analyze(chords);

        Assert.Equal(0.75, result.ContinuityScore);
    }

    [Fact]
    public void Analyze_SameChordRepeated_ContinuityScoreIsOne()
    {
        var chords = ChordRefs("C", "Major", "C", "Major");

        var result = _service.Analyze(chords);

        Assert.Equal(1.0, result.ContinuityScore);
    }

    [Fact]
    public void Analyze_SingleChord_ContinuityScoreIsOne()
    {
        var chords = new List<ChordRef> { new() { Root = "C", Quality = ChordQuality.Major } };

        var result = _service.Analyze(chords);

        Assert.Empty(result.Steps);
        Assert.Equal(1.0, result.ContinuityScore);
    }

    [Fact]
    public void Analyze_ThreeChords_ContinuityScoreIsAverageOfSteps()
    {
        // C→F motion=3, F→G motion=6 → averageMotion=4.5, 1 - 4.5/12 = 0.625
        var chords = ChordRefs("C", "Major", "F", "Major", "G", "Major");

        var result = _service.Analyze(chords);

        Assert.Equal(2, result.Steps.Count);
        Assert.Equal(0.625, result.ContinuityScore, precision: 10);
    }

    // ── TensionTrend ─────────────────────────────────────────────────────────

    [Fact]
    public void Analyze_MajorChords_TensionIsZero()
    {
        // Major chord intervals: major 3rd (IC4), perfect 5th (IC5), minor 3rd (IC3) — all consonant
        var chords = ChordRefs("C", "Major", "G", "Major");

        var result = _service.Analyze(chords);

        Assert.Equal(2, result.TensionTrend.Count);
        Assert.Equal(0.0, result.TensionTrend[0]);
        Assert.Equal(0.0, result.TensionTrend[1]);
    }

    [Fact]
    public void Analyze_DiminishedChord_TensionReflectsTritone()
    {
        // C Diminished [0,3,6]: pairs (0,3)=IC3, (0,6)=IC6 (rough), (3,6)=IC3 → 1/3
        var chords = new List<ChordRef> { new() { Root = "C", Quality = ChordQuality.Diminished } };

        var result = _service.Analyze(chords);

        Assert.Single(result.TensionTrend);
        Assert.Equal(1.0 / 3.0, result.TensionTrend[0], precision: 10);
    }

    [Fact]
    public void Analyze_Dominant7Chord_TensionReflectsMinor7AndTritone()
    {
        // C Dom7 [0,4,7,10]: pairs → IC4,IC5,IC2(rough),IC3,IC6(rough),IC3 → 2/6 = 1/3
        var chords = new List<ChordRef> { new() { Root = "C", Quality = ChordQuality.Dominant7 } };

        var result = _service.Analyze(chords);

        Assert.Equal(1.0 / 3.0, result.TensionTrend[0], precision: 10);
    }

    // ── Step fields ───────────────────────────────────────────────────────────

    [Fact]
    public void Analyze_CMajorToGMajor_StepFromToIsPreserved()
    {
        var chords = ChordRefs("C", "Major", "G", "Major");

        var result = _service.Analyze(chords);

        var step = result.Steps[0];
        Assert.Equal("C", step.From.Root);
        Assert.Equal(ChordQuality.Major, step.From.Quality);
        Assert.Equal("G", step.To.Root);
        Assert.Equal(ChordQuality.Major, step.To.Quality);
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

        var result = _service.Analyze(chords);

        Assert.Single(result.Steps);
        Assert.Equal(3, result.Steps[0].Motion);
        Assert.Equal(0.75, result.ContinuityScore);
        Assert.Equal([0.0, 0.0], result.TensionTrend);
    }

    // ── CustomNotes ───────────────────────────────────────────────────────────

    [Fact]
    public void Analyze_CustomNotes_UsesProvidedPitchClasses()
    {
        // Custom C major triad: pitch classes [0, 4, 7] — same as ChordGenerator output
        var chords = new List<ChordRef>
        {
            new() { Root = "C", Quality = ChordQuality.Major, CustomNotes = [0, 4, 7] },
            new() { Root = "G", Quality = ChordQuality.Major },
        };

        var result = _service.Analyze(chords);

        Assert.Single(result.Steps);
        Assert.Equal(3, result.Steps[0].Motion);
    }

    [Fact]
    public void Analyze_EmptyCustomNotes_FallsBackToRootAndQuality()
    {
        var chords = new List<ChordRef>
        {
            new() { Root = "C", Quality = ChordQuality.Major, CustomNotes = [] },
            new() { Root = "G", Quality = ChordQuality.Major },
        };

        var result = _service.Analyze(chords);

        Assert.Equal(3, result.Steps[0].Motion);
    }

    [Fact]
    public void Analyze_CustomNotes_FiltersOutOfRangePitchClasses()
    {
        // Out-of-range values (12, -1) are discarded; valid subset [0, 4, 7] matches C major
        var chords = new List<ChordRef>
        {
            new() { Root = "C", Quality = ChordQuality.Major, CustomNotes = [0, 4, 7, 12, -1] },
            new() { Root = "G", Quality = ChordQuality.Major },
        };

        var result = _service.Analyze(chords);

        Assert.Equal(3, result.Steps[0].Motion);
    }

    [Fact]
    public void Analyze_CustomNotes_DeduplicatesPitchClasses()
    {
        // Duplicates (0, 0, 4, 7) → [0, 4, 7] → same motion as C major → G major
        var chords = new List<ChordRef>
        {
            new() { Root = "C", Quality = ChordQuality.Major, CustomNotes = [0, 0, 4, 7] },
            new() { Root = "G", Quality = ChordQuality.Major },
        };

        var result = _service.Analyze(chords);

        Assert.Equal(3, result.Steps[0].Motion);
    }

    [Fact]
    public void Analyze_CustomNotesAllOutOfRange_FallsBackToRootAndQuality()
    {
        // All custom notes are out of range → fall back to root + quality
        var chords = new List<ChordRef>
        {
            new() { Root = "C", Quality = ChordQuality.Major, CustomNotes = [15, -3, 99] },
            new() { Root = "G", Quality = ChordQuality.Major },
        };

        var result = _service.Analyze(chords);

        Assert.Equal(3, result.Steps[0].Motion);
    }

    // ── ScaleContext on request ───────────────────────────────────────────────

    [Fact]
    public void Analyze_WithScaleContext_StillProducesCorrectMotion()
    {
        // ScaleContext is accepted on the request DTO without affecting motion calculation
        var chords = ChordRefs("C", "Major", "G", "Major");
        var dto = new ProgressionAnalyzeRequestDto
        {
            Chords = chords,
            ScaleContext = new ScaleContextDto { Root = 0, Mode = ScaleType.Major },
        };

        var result = _service.Analyze(dto.Chords);

        Assert.Equal(3, result.Steps[0].Motion);
    }

    // ── Quartal ───────────────────────────────────────────────────────────────

    [Fact]
    public void Analyze_QuartalChord_Returns200WithPitchClasses()
    {
        // C Quartal [0, 5, 10] (stacked perfect fourths)
        var chords = new List<ChordRef> { new() { Root = "C", Quality = ChordQuality.Quartal } };

        var result = _service.Analyze(chords);

        Assert.Empty(result.Steps);
        Assert.Single(result.TensionTrend);
    }

    [Fact]
    public void Analyze_QuartalToMajor_ProducesMotion()
    {
        // C Quartal [0,5,10] → C Major [0,4,7]
        var chords = new List<ChordRef>
        {
            new() { Root = "C", Quality = ChordQuality.Quartal },
            new() { Root = "C", Quality = ChordQuality.Major },
        };

        var result = _service.Analyze(chords);

        Assert.Single(result.Steps);
        Assert.True(result.Steps[0].Motion >= 0);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static List<ChordRef> ChordRefs(params string[] rootsAndQualities)
    {
        var list = new List<ChordRef>();
        for (int i = 0; i < rootsAndQualities.Length; i += 2)
            list.Add(new ChordRef
            {
                Root    = rootsAndQualities[i],
                Quality = Enum.Parse<ChordQuality>(rootsAndQualities[i + 1], ignoreCase: true),
            });
        return list;
    }
}
