using ParametricMusic.Api.Models;

namespace ParametricMusic.Api.Services;

/// <summary>
/// Builds and identifies diatonic quartal chords for any 7-note scale.
/// </summary>
/// <remarks>
/// Implements <see cref="IQuartalChordService"/> for use with dependency injection.
/// <para>
/// A diatonic quartal triad on scale degree <c>i</c> (0-indexed) is defined as:
/// <code>Q(i) = [ S[i], S[(i+3) % 7], S[(i+6) % 7] ]</code>
/// where <c>S[0..6]</c> is the 7-note scale array. This stacks diatonic fourths
/// (which may be perfect fourths of 5 semitones, or augmented fourths of 6
/// semitones, depending on the scale) above each degree.
/// </para>
/// </remarks>
public class QuartalChordGenerator(IScaleService scaleService) : IQuartalChordService
{
    private static readonly string[] DegreeRomanNumerals = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];

    /// <inheritdoc />
    public QuartalChordDto BuildDiatonicQuartal(int root, ScaleType scaleType, int degree, int size = 3)
    {
        if (degree < 1 || degree > 7)
            throw new ArgumentOutOfRangeException(nameof(degree), degree, "Degree must be between 1 and 7.");
        if (size < 2 || size > 7)
            throw new ArgumentOutOfRangeException(nameof(size), size, "Size must be between 2 and 7.");

        var scaleNotes = scaleService.BuildScale(root, scaleType);
        var degreeIndex = degree - 1; // convert to 0-based

        // Q(i) = [ S[i], S[(i+3)%7], S[(i+6)%7], ... ] for 'size' voices
        var pitchClasses = new int[size];
        var noteNames = new string[size];
        for (int k = 0; k < size; k++)
        {
            var idx = (degreeIndex + k * 3) % 7;
            pitchClasses[k] = scaleNotes[idx].Index;
            noteNames[k] = scaleNotes[idx].Name;
        }

        var chordRoot = noteNames[0];
        var scaleRootNote = (Note)root;
        var roman = DegreeRomanNumerals[degreeIndex];

        return new QuartalChordDto
        {
            Root        = chordRoot,
            Quality     = "Quartal",
            DisplayName = $"{chordRoot} Quartal{size} ({roman})",
            PitchClasses = pitchClasses,
            NoteNames   = noteNames,
            Quartal = new QuartalMetadata
            {
                IsDiatonic = true,
                ScaleRoot  = scaleRootNote.GetDisplayName(),
                ScaleType  = scaleType.ToString(),
                Degree     = degree,
                Size       = size,
            },
        };
    }

    /// <summary>
    /// Identifies the scale degree whose diatonic quartal triad matches the given pitch-class set.
    /// </summary>
    /// <param name="root">The root pitch-class index of the scale.</param>
    /// <param name="scaleType">The scale type to search within.</param>
    /// <param name="pitchClasses">The pitch-class set to match (order-independent).</param>
    /// <param name="size">The number of voices to check (default 3).</param>
    /// <returns>
    /// A <see cref="QuartalChordDto"/> for the matching degree, or <c>null</c> if no match is found.
    /// </returns>
    public QuartalChordDto? IdentifyDiatonicQuartal(int root, ScaleType scaleType, IEnumerable<int> pitchClasses, int size = 3)
    {
        var targetSet = new HashSet<int>(pitchClasses);

        for (int degree = 1; degree <= 7; degree++)
        {
            var candidate = BuildDiatonicQuartal(root, scaleType, degree, size);
            if (new HashSet<int>(candidate.PitchClasses).SetEquals(targetSet))
                return candidate;
        }

        return null;
    }
}
