using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using ParametricMusic.Api.Models;
using ParametricMusic.Api.Services;

namespace ParametricMusic.Api.Controllers;

[ApiController]
[Route("[controller]")]
[Tags("Scale")]
public class ScaleController(IScaleService scaleService) : ControllerBase
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

        return Ok(scaleService.BuildScale((int)note, body.ScaleType));
    }
}
