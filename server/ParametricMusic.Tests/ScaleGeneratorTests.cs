public class ScaleGeneratorTests
{
    [Fact]
    public void BuildMajorScale_Root0_ReturnsUnshiftedPattern()
    {
        var result = ScaleGenerator.BuildMajorScale(0);
        Assert.Equal([0, 2, 4, 5, 7, 9, 11], result);
    }

    [Fact]
    public void BuildMajorScale_Root5_ReturnsCorrectlyTransposedScale()
    {
        var result = ScaleGenerator.BuildMajorScale(5);
        Assert.Equal([5, 7, 9, 10, 0, 2, 4], result);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(11)]
    public void BuildMajorScale_ValidRoot_ReturnsSevenPitchClasses(int root)
    {
        var result = ScaleGenerator.BuildMajorScale(root);
        Assert.Equal(7, result.Length);
        Assert.All(result, pc => Assert.InRange(pc, 0, 11));
    }

    [Fact]
    public void BuildMajorScale_Root11_WrapsAroundCorrectly()
    {
        var result = ScaleGenerator.BuildMajorScale(11);
        Assert.Equal([11, 1, 3, 4, 6, 8, 10], result);
    }
}
