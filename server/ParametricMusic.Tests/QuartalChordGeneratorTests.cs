public class QuartalChordGeneratorTests
{
    private readonly IScaleService _scaleService = new ScaleGenerator();
    private QuartalChordGenerator Service => new QuartalChordGenerator(_scaleService);

    // ── BuildDiatonicQuartal — basic correctness ──────────────────────────────

    [Fact]
    public void BuildDiatonicQuartal_CMajorDegree1_ReturnsExpectedPitchClasses()
    {
        // C major scale: [0,2,4,5,7,9,11]
        // Degree 1 (0-indexed 0): S[0]=0, S[3]=5, S[6]=11 → [0,5,11]
        var result = Service.BuildDiatonicQuartal(0, ScaleType.Major, degree: 1);
        Assert.Equal([0, 5, 11], result.PitchClasses);
        Assert.Equal("C", result.Root);
    }

    [Fact]
    public void BuildDiatonicQuartal_CMajorDegree2_ReturnsExpectedPitchClasses()
    {
        // C major scale: [0,2,4,5,7,9,11]
        // Degree 2 (0-indexed 1): S[1]=2, S[4]=7, S[0]=0 → [2,7,0]
        var result = Service.BuildDiatonicQuartal(0, ScaleType.Major, degree: 2);
        Assert.Equal([2, 7, 0], result.PitchClasses);
    }

    [Fact]
    public void BuildDiatonicQuartal_CMajorDegree7_ReturnsExpectedPitchClasses()
    {
        // C major: [0,2,4,5,7,9,11]
        // Degree 7 (0-indexed 6): S[6]=11, S[2]=4, S[5]=9 → [11,4,9]
        var result = Service.BuildDiatonicQuartal(0, ScaleType.Major, degree: 7);
        Assert.Equal([11, 4, 9], result.PitchClasses);
    }

    [Fact]
    public void BuildDiatonicQuartal_QualityFieldIsAlwaysQuartal()
    {
        for (int degree = 1; degree <= 7; degree++)
        {
            var result = Service.BuildDiatonicQuartal(0, ScaleType.Major, degree: degree);
            Assert.Equal("Quartal", result.Quality);
        }
    }

    [Fact]
    public void BuildDiatonicQuartal_DisplayNameContainsRootAndDegree()
    {
        var result = Service.BuildDiatonicQuartal(0, ScaleType.Major, degree: 1);
        Assert.Contains("C", result.DisplayName);
        Assert.Contains("Quartal", result.DisplayName);
        Assert.Contains("I", result.DisplayName);
    }

    [Fact]
    public void BuildDiatonicQuartal_MetadataIsDiatonicIsTrue()
    {
        var result = Service.BuildDiatonicQuartal(0, ScaleType.Major, degree: 1);
        Assert.True(result.Quartal.IsDiatonic);
    }

    [Fact]
    public void BuildDiatonicQuartal_MetadataDegreeMatchesInput()
    {
        for (int degree = 1; degree <= 7; degree++)
        {
            var result = Service.BuildDiatonicQuartal(0, ScaleType.Major, degree: degree);
            Assert.Equal(degree, result.Quartal.Degree);
        }
    }

    [Fact]
    public void BuildDiatonicQuartal_DefaultSizeIsThree()
    {
        var result = Service.BuildDiatonicQuartal(0, ScaleType.Major, degree: 1);
        Assert.Equal(3, result.PitchClasses.Length);
        Assert.Equal(3, result.NoteNames.Length);
        Assert.Equal(3, result.Quartal.Size);
    }

    [Fact]
    public void BuildDiatonicQuartal_Size4_ReturnsFourPitchClasses()
    {
        var result = Service.BuildDiatonicQuartal(0, ScaleType.Major, degree: 1, size: 4);
        Assert.Equal(4, result.PitchClasses.Length);
        Assert.Equal(4, result.NoteNames.Length);
    }

    // ── BuildDiatonicQuartal — invariants ────────────────────────────────────

    [Theory]
    [InlineData(0)]
    [InlineData(5)]
    [InlineData(11)]
    public void BuildDiatonicQuartal_AllPitchClassesInRange0To11(int root)
    {
        for (int degree = 1; degree <= 7; degree++)
        {
            var result = Service.BuildDiatonicQuartal(root, ScaleType.Major, degree: degree);
            Assert.All(result.PitchClasses, pc => Assert.InRange(pc, 0, 11));
        }
    }

    [Theory]
    [InlineData(ScaleType.Major)]
    [InlineData(ScaleType.NaturalMinor)]
    [InlineData(ScaleType.Dorian)]
    [InlineData(ScaleType.Mixolydian)]
    public void BuildDiatonicQuartal_AllPitchClassesInScaleForAllDegrees(ScaleType scaleType)
    {
        var scaleNotes = _scaleService.BuildScale(0, scaleType).Select(n => n.Index).ToHashSet();
        for (int degree = 1; degree <= 7; degree++)
        {
            var result = Service.BuildDiatonicQuartal(0, scaleType, degree: degree);
            Assert.All(result.PitchClasses, pc => Assert.Contains(pc, scaleNotes));
        }
    }

    [Fact]
    public void BuildDiatonicQuartal_NoteNamesLengthMatchesPitchClassesLength()
    {
        for (int degree = 1; degree <= 7; degree++)
        {
            var result = Service.BuildDiatonicQuartal(0, ScaleType.Major, degree: degree);
            Assert.Equal(result.PitchClasses.Length, result.NoteNames.Length);
        }
    }

    [Fact]
    public void BuildDiatonicQuartal_RootNameMatchesFirstNoteOfDegree()
    {
        var result = Service.BuildDiatonicQuartal(0, ScaleType.Major, degree: 1);
        Assert.Equal(result.NoteNames[0], result.Root);
    }

    // ── BuildDiatonicQuartal — validation ────────────────────────────────────

    [Theory]
    [InlineData(0)]
    [InlineData(8)]
    [InlineData(-1)]
    public void BuildDiatonicQuartal_InvalidDegree_Throws(int degree)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            Service.BuildDiatonicQuartal(0, ScaleType.Major, degree: degree));
    }

    [Theory]
    [InlineData(1)]
    [InlineData(8)]
    public void BuildDiatonicQuartal_InvalidSize_Throws(int size)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            Service.BuildDiatonicQuartal(0, ScaleType.Major, degree: 1, size: size));
    }

    // ── IdentifyDiatonicQuartal — basic correctness ──────────────────────────

    [Fact]
    public void IdentifyDiatonicQuartal_MatchesDegree1_CMajor()
    {
        // [0,5,11] is the degree-1 quartal in C major
        var result = Service.IdentifyDiatonicQuartal(0, ScaleType.Major, [0, 5, 11]);
        Assert.NotNull(result);
        Assert.Equal(1, result!.Quartal.Degree);
    }

    [Fact]
    public void IdentifyDiatonicQuartal_OrderIndependent_StillFindsMatch()
    {
        // [11,5,0] is the same set as [0,5,11]
        var result = Service.IdentifyDiatonicQuartal(0, ScaleType.Major, [11, 5, 0]);
        Assert.NotNull(result);
        Assert.Equal(1, result!.Quartal.Degree);
    }

    [Fact]
    public void IdentifyDiatonicQuartal_ReturnsNullForNonDiatonicSet()
    {
        // [0,4,7] is C major (not a quartal chord in C major)
        var result = Service.IdentifyDiatonicQuartal(0, ScaleType.Major, [0, 4, 7]);
        Assert.Null(result);
    }

    [Fact]
    public void IdentifyDiatonicQuartal_AllDegreesAreIdentifiable_CMajor()
    {
        // Every degree's quartal built from C major should be identifiable
        for (int degree = 1; degree <= 7; degree++)
        {
            var built = Service.BuildDiatonicQuartal(0, ScaleType.Major, degree: degree);
            var identified = Service.IdentifyDiatonicQuartal(0, ScaleType.Major, built.PitchClasses);
            Assert.NotNull(identified);
            Assert.Equal(degree, identified!.Quartal.Degree);
        }
    }
}
