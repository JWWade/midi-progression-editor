using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

[ApiController]
[Route("[controller]")]
[Tags("Scale")]
public class ScaleController : ControllerBase
{
    /// <summary>
    /// Generate a musical scale from a root note with specified options.
    /// </summary>
    [HttpPost("from-root")]
    [ProducesResponseType(typeof(NoteInfo[]), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public IActionResult BuildScale(
        [FromQuery]
        [Display(Name = "Root Note", Description = "Select the root note for the scale")]
        Note note,
        [FromBody]
        [Display(Name = "Scale Options")]
        ScaleOptionsDto body)
    {
        ArgumentNullException.ThrowIfNull(body, nameof(body));

        return Ok(ScaleGenerator.BuildScale((int)note, body.ScaleType));
    }
}
