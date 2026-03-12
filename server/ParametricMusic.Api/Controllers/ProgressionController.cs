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
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult Analyze([FromBody] ProgressionAnalyzeRequestDto request)
    {
        if (request.Chords.Count == 0)
            return BadRequest("Progression must contain at least one chord.");

        if (request.Chords.Count > 8)
            return BadRequest("Progression must not exceed 8 chords.");

        try
        {
            var result = ProgressionAnalyzer.Analyze(request.Chords);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
