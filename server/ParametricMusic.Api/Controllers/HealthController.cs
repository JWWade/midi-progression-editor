using Microsoft.AspNetCore.Mvc;
using ParametricMusic.Api.Models;

namespace ParametricMusic.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class HealthController : ControllerBase
{
    /// <summary>
    /// Returns the current health status of the API.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(HealthResponse), StatusCodes.Status200OK)]
    public IActionResult Get() => Ok(new HealthResponse { Status = "healthy", Timestamp = DateTime.UtcNow });
}
