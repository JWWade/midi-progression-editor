using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Text.Json;

public class HealthControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public HealthControllerIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    // ── 200 OK cases ──────────────────────────────────────────────────────────

    [Fact]
    public async Task GetHealth_Returns200WithHealthyStatus()
    {
        var response = await _client.GetAsync("/Health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        var dto = JsonSerializer.Deserialize<HealthResponse>(json, JsonOptions);
        Assert.NotNull(dto);
        Assert.Equal("healthy", dto!.Status);
        Assert.True(dto.Timestamp > DateTime.MinValue);
    }

    // ── 404 Not Found – unknown sub-path ──────────────────────────────────────

    [Fact]
    public async Task GetHealth_UnknownSubPath_Returns404()
    {
        var response = await _client.GetAsync("/Health/nonexistent");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
