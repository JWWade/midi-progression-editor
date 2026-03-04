using System.ComponentModel.DataAnnotations;

public enum ScaleType
{
    [Display(Name = "Major", Description = "Major scale (Ionian mode)")]
    Major,
    [Display(Name = "Minor", Description = "Natural minor scale (Aeolian mode)")]
    Minor
}
