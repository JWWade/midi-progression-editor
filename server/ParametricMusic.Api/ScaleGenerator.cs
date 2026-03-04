public static class ScaleGenerator
{
    private static readonly int[] MajorScaleIntervals = [0, 2, 4, 5, 7, 9, 11];

    public static NoteInfo[] BuildMajorScale(int root)
    {
        return MajorScaleIntervals
            .Select(interval => 
            {
                var noteIndex = (root + interval) % 12;
                var note = (Note)noteIndex;
                return new NoteInfo(noteIndex, note.GetDisplayName());
            })
            .ToArray();
    }
}
