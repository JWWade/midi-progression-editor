using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("[controller]")]
[Tags("Progression")]
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
            return ProblemJson(detail: "Progression must contain at least one chord.");

        if (request.Chords.Count > 8)
            return ProblemJson(detail: "Progression must not exceed 8 chords.");

        try
        {
            var result = ProgressionAnalyzer.Analyze(request.Chords);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return ProblemJson(detail: ex.Message);
        }
    }

    private ObjectResult ProblemJson(string detail)
    {
        var result = Problem(detail: detail, statusCode: StatusCodes.Status400BadRequest);
        result.ContentTypes.Add("application/problem+json");
        return result;
    }
}
