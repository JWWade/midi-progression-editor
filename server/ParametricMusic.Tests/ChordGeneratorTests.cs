public class ChordGeneratorTests
{
    private readonly IChordService _service = new ChordGenerator();

    // ── Root C (index 0) triads ──────────────────────────────────────────────

    [Fact]
    public void BuildChord_CMajor_ReturnsExpectedPitchClasses()
    {
        var result = _service.BuildChord(Note.C, ChordQuality.Major);
        Assert.Equal([0, 4, 7], result.PitchClasses);
        Assert.Equal(["C", "E", "G"], result.NoteNames);
    }

    [Fact]
    public void BuildChord_CMinor_ReturnsExpectedPitchClasses()
    {
        var result = _service.BuildChord(Note.C, ChordQuality.Minor);
        Assert.Equal([0, 3, 7], result.PitchClasses);
        Assert.Equal(["C", "D#", "G"], result.NoteNames);
    }

    [Fact]
    public void BuildChord_CDiminished_ReturnsExpectedPitchClasses()
    {
        var result = _service.BuildChord(Note.C, ChordQuality.Diminished);
        Assert.Equal([0, 3, 6], result.PitchClasses);
        Assert.Equal(["C", "D#", "F#"], result.NoteNames);
    }

    [Fact]
    public void BuildChord_CAugmented_ReturnsExpectedPitchClasses()
    {
        var result = _service.BuildChord(Note.C, ChordQuality.Augmented);
        Assert.Equal([0, 4, 8], result.PitchClasses);
        Assert.Equal(["C", "E", "G#"], result.NoteNames);
    }

    [Fact]
    public void BuildChord_CDominant7_ReturnsExpectedPitchClasses()
    {
        var result = _service.BuildChord(Note.C, ChordQuality.Dominant7);
        Assert.Equal([0, 4, 7, 10], result.PitchClasses);
        Assert.Equal(["C", "E", "G", "A#"], result.NoteNames);
    }

    [Fact]
    public void BuildChord_CMajor7_ReturnsExpectedPitchClasses()
    {
        var result = _service.BuildChord(Note.C, ChordQuality.Major7);
        Assert.Equal([0, 4, 7, 11], result.PitchClasses);
        Assert.Equal(["C", "E", "G", "B"], result.NoteNames);
    }

    [Fact]
    public void BuildChord_CMinor7_ReturnsExpectedPitchClasses()
    {
        var result = _service.BuildChord(Note.C, ChordQuality.Minor7);
        Assert.Equal([0, 3, 7, 10], result.PitchClasses);
        Assert.Equal(["C", "D#", "G", "A#"], result.NoteNames);
    }

    [Fact]
    public void BuildChord_CHalfDiminished7_ReturnsExpectedPitchClasses()
    {
        var result = _service.BuildChord(Note.C, ChordQuality.HalfDiminished7);
        Assert.Equal([0, 3, 6, 10], result.PitchClasses);
        Assert.Equal(["C", "D#", "F#", "A#"], result.NoteNames);
    }

    // ── Root B (index 11) – wrap-around ──────────────────────────────────────

    [Fact]
    public void BuildChord_BMajor_WrapsAroundCorrectly()
    {
        var result = _service.BuildChord(Note.B, ChordQuality.Major);
        Assert.Equal([11, 3, 6], result.PitchClasses);
        Assert.Equal(["B", "D#", "F#"], result.NoteNames);
    }

    [Fact]
    public void BuildChord_BDominant7_WrapsAroundCorrectly()
    {
        var result = _service.BuildChord(Note.B, ChordQuality.Dominant7);
        Assert.Equal([11, 3, 6, 9], result.PitchClasses);
        Assert.Equal(["B", "D#", "F#", "A"], result.NoteNames);
    }

    // ── DisplayName & metadata ────────────────────────────────────────────────

    [Fact]
    public void BuildChord_CMajor_HasCorrectDisplayName()
    {
        var result = _service.BuildChord(Note.C, ChordQuality.Major);
        Assert.Equal("C Major", result.DisplayName);
        Assert.Equal("C", result.Root);
        Assert.Equal(ChordQuality.Major, result.Quality);
    }

    [Fact]
    public void BuildChord_CDominant7_HasCorrectDisplayName()
    {
        var result = _service.BuildChord(Note.C, ChordQuality.Dominant7);
        Assert.Equal("C Dominant 7th", result.DisplayName);
    }

    [Fact]
    public void BuildChord_BMajor_HasCorrectRootName()
    {
        var result = _service.BuildChord(Note.B, ChordQuality.Major);
        Assert.Equal("B", result.Root);
    }
}
