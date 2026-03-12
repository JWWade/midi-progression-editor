using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

public class ProgressionControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public ProgressionControllerIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    // ── 400 Bad Request – validation ──────────────────────────────────────────

    [Fact]
    public async Task PostAnalyze_ZeroChords_Returns400()
    {
        var response = await PostAnalyzeAsync("""{"chords": []}""");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PostAnalyze_NineChords_Returns400()
    {
        var nine = string.Join(",", Enumerable.Repeat("""{"root":"C","quality":"Major"}""", 9));
        var response = await PostAnalyzeAsync($$"""{"chords": [{{nine}}]}""");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PostAnalyze_InvalidRootNote_Returns400()
    {
        var response = await PostAnalyzeAsync("""{"chords": [{"root":"Z","quality":"Major"}]}""");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PostAnalyze_InvalidQuality_Returns400()
    {
        var response = await PostAnalyzeAsync("""{"chords": [{"root":"C","quality":"NotAQuality"}]}""");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ── 200 OK – boundary values ──────────────────────────────────────────────

    [Fact]
    public async Task PostAnalyze_OneChord_Returns200()
    {
        var response = await PostAnalyzeAsync("""{"chords": [{"root":"C","quality":"Major"}]}""");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var dto = await DeserializeResponseDto(response);
        Assert.NotNull(dto);
        Assert.Empty(dto!.Steps);
        Assert.Equal(1.0, dto.ContinuityScore);
        Assert.Single(dto.TensionTrend);
    }

    [Fact]
    public async Task PostAnalyze_EightChords_Returns200()
    {
        var eight = string.Join(",", Enumerable.Repeat("""{"root":"C","quality":"Major"}""", 8));
        var response = await PostAnalyzeAsync($$"""{"chords": [{{eight}}]}""");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── Deterministic fixture ─────────────────────────────────────────────────

    [Fact]
    public async Task PostAnalyze_CMajorToGMajor_ReturnsExactKnownValues()
    {
        var body = """
        {
            "chords": [
                { "root": "C", "quality": "Major" },
                { "root": "G", "quality": "Major" }
            ]
        }
        """;

        var response = await PostAnalyzeAsync(body);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var dto = await DeserializeResponseDto(response);
        Assert.NotNull(dto);

        Assert.Single(dto!.Steps);
        Assert.Equal("C", dto.Steps[0].From.Root);
        Assert.Equal("Major", dto.Steps[0].From.Quality);
        Assert.Equal("G", dto.Steps[0].To.Root);
        Assert.Equal("Major", dto.Steps[0].To.Quality);
        Assert.Equal(3, dto.Steps[0].Motion);

        Assert.Equal(0.75, dto.ContinuityScore);

        Assert.Equal(2, dto.TensionTrend.Count);
        Assert.Equal(0.0, dto.TensionTrend[0]);
        Assert.Equal(0.0, dto.TensionTrend[1]);
    }

    // ── Primitive shape round-trip ────────────────────────────────────────────

    [Theory]
    [InlineData("equilateral-triangle")]
    [InlineData("suspended-triangle")]
    [InlineData("square")]
    [InlineData("rectangle")]
    public async Task PostAnalyze_WithPrimitiveShape_RoundTripsShapeInSteps(string shape)
    {
        var body = $$"""
        {
            "chords": [
                { "root": "C", "quality": "Major", "primitiveShape": "{{shape}}" },
                { "root": "G", "quality": "Major" }
            ]
        }
        """;

        var response = await PostAnalyzeAsync(body);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(json);
        var fromShape = doc.RootElement
            .GetProperty("steps")[0]
            .GetProperty("from")
            .GetProperty("primitiveShape")
            .GetString();
        Assert.Equal(shape, fromShape);
    }

    [Fact]
    public async Task PostAnalyze_InvalidPrimitiveShape_Returns400()
    {
        var response = await PostAnalyzeAsync("""{"chords": [{"root":"C","quality":"Major","primitiveShape":"hexagon"}]}""");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Task<HttpResponseMessage> PostAnalyzeAsync(string body)
        => _client.PostAsync(
            "/Progression/analyze",
            new StringContent(body, Encoding.UTF8, "application/json"));

    private static async Task<ProgressionAnalyzeResponseDto?> DeserializeResponseDto(HttpResponseMessage response)
    {
        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<ProgressionAnalyzeResponseDto>(json, JsonOptions);
    }
}
