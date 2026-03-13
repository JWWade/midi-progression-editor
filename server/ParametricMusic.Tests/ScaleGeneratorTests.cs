public class ScaleGeneratorTests
{
    // ── All 8 modes at root C (root = 0) ────────────────────────────────────

    [Theory]
    [InlineData(ScaleType.Major,         new[] { 0, 2, 4, 5, 7, 9, 11 })]
    [InlineData(ScaleType.NaturalMinor,  new[] { 0, 2, 3, 5, 7, 8, 10 })]
    [InlineData(ScaleType.HarmonicMinor, new[] { 0, 2, 3, 5, 7, 8, 11 })]
    [InlineData(ScaleType.MelodicMinor,  new[] { 0, 2, 3, 5, 7, 9, 11 })]
    [InlineData(ScaleType.Dorian,        new[] { 0, 2, 3, 5, 7, 9, 10 })]
    [InlineData(ScaleType.Phrygian,      new[] { 0, 1, 3, 5, 7, 8, 10 })]
    [InlineData(ScaleType.Lydian,        new[] { 0, 2, 4, 6, 7, 9, 11 })]
    [InlineData(ScaleType.Mixolydian,    new[] { 0, 2, 4, 5, 7, 9, 10 })]
    public void BuildScale_RootC_AllModes_ReturnsExpectedPitchClasses(ScaleType scaleType, int[] expected)
    {
        var result = ScaleGenerator.BuildScale(0, scaleType);
        Assert.Equal(expected, result.Select(n => n.Index));
    }

    // ── Transposition for non-C roots ────────────────────────────────────────

    [Fact]
    public void BuildScale_RootG_Major_ReturnsTransposedPitchClasses()
    {
        // G = 7; Major intervals [0,2,4,5,7,9,11] → [7,9,11,0,2,4,6]
        var result = ScaleGenerator.BuildScale(7, ScaleType.Major);
        Assert.Equal([7, 9, 11, 0, 2, 4, 6], result.Select(n => n.Index));
    }

    [Fact]
    public void BuildScale_RootD_NaturalMinor_ReturnsTransposedPitchClasses()
    {
        // D = 2; NaturalMinor intervals [0,2,3,5,7,8,10] → [2,4,5,7,9,10,0]
        var result = ScaleGenerator.BuildScale(2, ScaleType.NaturalMinor);
        Assert.Equal([2, 4, 5, 7, 9, 10, 0], result.Select(n => n.Index));
    }

    // ── General properties ────────────────────────────────────────────────────

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(11)]
    public void BuildScale_ValidRoot_ReturnsSevenPitchClasses(int root)
    {
        var result = ScaleGenerator.BuildScale(root, ScaleType.Major);
        Assert.Equal(7, result.Length);
        Assert.All(result, n => Assert.InRange(n.Index, 0, 11));
    }

    [Fact]
    public void BuildScale_RootB_Major_WrapsAroundCorrectly()
    {
        // B = 11; Major intervals → [11,1,3,4,6,8,10]
        var result = ScaleGenerator.BuildScale(11, ScaleType.Major);
        Assert.Equal([11, 1, 3, 4, 6, 8, 10], result.Select(n => n.Index));
    }
}
