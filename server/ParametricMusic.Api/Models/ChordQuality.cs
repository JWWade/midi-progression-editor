using System.ComponentModel.DataAnnotations;

namespace ParametricMusic.Api.Models;

public enum ChordQuality
{
    [Display(Name = "Major", Description = "Major triad (root, major 3rd, perfect 5th)")]
    Major,
    [Display(Name = "Minor", Description = "Minor triad (root, minor 3rd, perfect 5th)")]
    Minor,
    [Display(Name = "Diminished", Description = "Diminished triad (root, minor 3rd, diminished 5th)")]
    Diminished,
    [Display(Name = "Augmented", Description = "Augmented triad (root, major 3rd, augmented 5th)")]
    Augmented,
    [Display(Name = "Sus 2", Description = "Suspended second chord (root, major 2nd, perfect 5th — no third)")]
    Sus2,
    [Display(Name = "Major 6", Description = "Major sixth chord (root, major 3rd, perfect 5th, major 6th)")]
    Major6,
    [Display(Name = "Minor 6", Description = "Minor sixth chord (root, minor 3rd, perfect 5th, major 6th)")]
    Minor6,
    [Display(Name = "Dominant 7th", Description = "Dominant seventh chord (root, major 3rd, perfect 5th, minor 7th)")]
    Dominant7,
    [Display(Name = "Dom 7 Sus4", Description = "Dominant seventh suspended fourth (root, perfect 4th, perfect 5th, minor 7th — no third)")]
    Dom7Sus4,
    [Display(Name = "Major 7th", Description = "Major seventh chord (root, major 3rd, perfect 5th, major 7th)")]
    Major7,
    [Display(Name = "Minor 7th", Description = "Minor seventh chord (root, minor 3rd, perfect 5th, minor 7th)")]
    Minor7,
    [Display(Name = "Minor-Major 7", Description = "Minor-major seventh chord (root, minor 3rd, perfect 5th, major 7th)")]
    MinMaj7,
    [Display(Name = "Half-Diminished 7th", Description = "Half-diminished seventh chord (root, minor 3rd, diminished 5th, minor 7th)")]
    HalfDiminished7,
    [Display(Name = "Quartal", Description = "Quartal chord (root, perfect 4th, minor 7th — stacked fourths)")]
    Quartal
}
