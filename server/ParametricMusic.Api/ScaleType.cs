using System.ComponentModel.DataAnnotations;

public enum ScaleType
{
    [Display(Name = "Major", Description = "Major scale (Ionian mode)")]
    Major,
    [Display(Name = "Natural Minor", Description = "Natural minor scale (Aeolian mode)")]
    NaturalMinor,
    [Display(Name = "Harmonic Minor", Description = "Harmonic minor scale")]
    HarmonicMinor,
    [Display(Name = "Melodic Minor", Description = "Melodic minor scale (ascending)")]
    MelodicMinor,
    [Display(Name = "Dorian", Description = "Dorian mode")]
    Dorian,
    [Display(Name = "Phrygian", Description = "Phrygian mode")]
    Phrygian,
    [Display(Name = "Lydian", Description = "Lydian mode")]
    Lydian,
    [Display(Name = "Mixolydian", Description = "Mixolydian mode")]
    Mixolydian
}
