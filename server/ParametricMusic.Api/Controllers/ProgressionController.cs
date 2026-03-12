using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("[controller]")]
[Tags("Progression")]
[Produces("application/json")]
public class ProgressionController : ControllerBase
{
    /// <summary>
    /// Analyze a chord progression, returning voice-leading motion, continuity score, and tension trend.
    /// </summary>
    [HttpPost("analyze")]
    [ProducesResponseType(typeof(ProgressionAnalyzeResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public IActionResult Analyze([FromBody] ProgressionAnalyzeRequestDto request)
    {
        if (request.Chords.Count == 0)
            return Problem(detail: "Progression must contain at least one chord.", statusCode: StatusCodes.Status400BadRequest);

        if (request.Chords.Count > 8)
            return Problem(detail: "Progression must not exceed 8 chords.", statusCode: StatusCodes.Status400BadRequest);

        try
        {
            var result = ProgressionAnalyzer.Analyze(request.Chords);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return Problem(detail: ex.Message, statusCode: StatusCodes.Status400BadRequest);
        }
    }
}
