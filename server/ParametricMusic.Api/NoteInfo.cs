public class NoteInfo
{
    public int Index { get; init; }
    public string Name { get; init; } = string.Empty;

    public NoteInfo(int index, string name)
    {
        Index = index;
        Name = name;
    }
}
