using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

[ApiController]
[Route("[controller]")]
[Tags("Chord")]
public class ChordController : ControllerBase
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
        var chord = ChordGenerator.BuildChord(note, body.Quality, body.PrimitiveShape);
        return Ok(chord);
    }
}
