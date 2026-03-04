using System.ComponentModel.DataAnnotations;

public enum Note
{
    [Display(Name = "C")]
    C = 0,
    [Display(Name = "C#")]
    CSharp = 1,
    [Display(Name = "D")]
    D = 2,
    [Display(Name = "D#")]
    DSharp = 3,
    [Display(Name = "E")]
    E = 4,
    [Display(Name = "F")]
    F = 5,
    [Display(Name = "F#")]
    FSharp = 6,
    [Display(Name = "G")]
    G = 7,
    [Display(Name = "G#")]
    GSharp = 8,
    [Display(Name = "A")]
    A = 9,
    [Display(Name = "A#")]
    ASharp = 10,
    [Display(Name = "B")]
    B = 11
}

public static class NoteExtensions
{
    public static string GetDisplayName(this Note note) =>
        note switch
        {
            Note.C => "C",
            Note.CSharp => "C#",
            Note.D => "D",
            Note.DSharp => "D#",
            Note.E => "E",
            Note.F => "F",
            Note.FSharp => "F#",
            Note.G => "G",
            Note.GSharp => "G#",
            Note.A => "A",
            Note.ASharp => "A#",
            Note.B => "B",
            _ => "Unknown"
        };

    public static bool TryParse(string input, out Note result)
    {
        var normalizedInput = input?.Trim().ToUpperInvariant();
        
        result = normalizedInput switch
        {
            "C" => Note.C,
            "C#" or "CS" => Note.CSharp,
            "D" => Note.D,
            "D#" or "DS" => Note.DSharp,
            "E" => Note.E,
            "F" => Note.F,
            "F#" or "FS" => Note.FSharp,
            "G" => Note.G,
            "G#" or "GS" => Note.GSharp,
            "A" => Note.A,
            "A#" or "AS" => Note.ASharp,
            "B" => Note.B,
            _ => 0
        };

        return Enum.IsDefined(typeof(Note), result);
    }
}
