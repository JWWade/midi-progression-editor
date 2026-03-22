using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using ParametricMusic.Api.Models;
using ParametricMusic.Api.Services;

namespace ParametricMusic.Api.Controllers;

[ApiController]
[Route("[controller]")]
[Tags("Chord")]
public class ChordController(IChordService chordService, IQuartalChordService quartalChordService) : ControllerBase
{
    /// <summary>
    /// Build a chord from a root note and chord quality.
    /// </summary>
    [HttpPost("from-root")]
    [ProducesResponseType(typeof(ChordDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public IActionResult BuildChord(
        [FromQuery]
        [Display(Name = "Root Note", Description = "Select the root note for the chord")]
        Note note,
        [FromBody]
        [Display(Name = "Chord Options")]
        ChordFromRootRequestDto body)
    {
        var chord = chordService.BuildChord(note, body.Quality);
        return Ok(chord);
    }

    /// <summary>
    /// Build a diatonic quartal chord from a scale root, scale type, and scale degree.
    /// </summary>
    /// <remarks>
    /// Stacks diatonic fourths above the given scale degree using the formula
    /// <c>Q(i) = [ S[i], S[(i+3)%7], S[(i+6)%7] ]</c> where <c>S</c> is the 7-note scale
    /// and <c>i</c> is the 0-based degree index.
    /// </remarks>
    [HttpPost("quartal/from-scale")]
    [ProducesResponseType(typeof(QuartalChordDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public IActionResult BuildQuartalChord(
        [FromQuery]
        [Display(Name = "Scale Root Note", Description = "Select the root note of the scale")]
        Note note,
        [FromBody]
        [Display(Name = "Quartal Chord Options")]
        DiatonicQuartalRequestDto body)
    {
        ArgumentNullException.ThrowIfNull(body, nameof(body));

        var chord = quartalChordService.BuildDiatonicQuartal((int)note, body.ScaleType, body.Degree, body.Size);
        return Ok(chord);
    }
}
