using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("[controller]")]
public class ScaleController : ControllerBase
{
    [HttpGet("from-root")]
    public IActionResult GetFromRoot([FromQuery] int root)
    {
        if (root < 0 || root > 11)
            return BadRequest("root must be an integer between 0 and 11.");

        return Ok(ScaleGenerator.BuildMajorScale(root));
    }
}
