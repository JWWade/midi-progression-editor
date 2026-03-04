public static class ScaleGenerator
{
    private static readonly int[] MajorScaleIntervals = [0, 2, 4, 5, 7, 9, 11];

    public static int[] BuildMajorScale(int root) =>
        MajorScaleIntervals.Select(interval => (root + interval) % 12).ToArray();
}
