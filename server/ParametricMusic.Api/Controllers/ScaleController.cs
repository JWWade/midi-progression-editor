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
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult BuildScale(
        [FromQuery]
        [Display(Name = "Root Note", Description = "Select the root note for the scale")]
        Note note,
        [FromBody]
        [Display(Name = "Scale Options")]
        ScaleOptionsDto options)
    {
        ArgumentNullException.ThrowIfNull(options, nameof(options));

        return Ok(ScaleGenerator.BuildMajorScale((int)note));
    }
}
