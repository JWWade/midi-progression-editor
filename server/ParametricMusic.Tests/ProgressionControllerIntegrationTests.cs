using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

public class ProgressionControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactory<Program> _factory;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public ProgressionControllerIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
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

    [Theory]
    [InlineData(-1)]
    [InlineData(12)]
    [InlineData(99)]
    public async Task PostAnalyze_CustomNotesOutOfRange_Returns400(int invalidValue)
    {
        var body = $$"""
        {
            "chords": [
                { "root": "C", "quality": "Major", "customNotes": [0, 4, 7, {{invalidValue}}] }
            ]
        }
        """;

        var response = await PostAnalyzeAsync(body);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task PostAnalyze_CustomNotesWithDuplicates_Returns400()
    {
        var response = await PostAnalyzeAsync(
            """{"chords": [{"root":"C","quality":"Major","customNotes":[0,4,7,7]}]}""");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task PostAnalyze_CustomNotesTooLong_Returns400()
    {
        var longCustomNotes = string.Join(",", Enumerable.Range(0, 13).Select(v => v % 12));
        var body = $$"""{"chords":[{"root":"C","quality":"Major","customNotes":[{{longCustomNotes}}]}]}""";

        var response = await PostAnalyzeAsync(body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    // ── Problem Details – content-type and schema ──────────────────────────────

    [Fact]
    public async Task PostAnalyze_ZeroChords_ReturnsProblemDetailsContentType()
    {
        var response = await PostAnalyzeAsync("""{"chords": []}""");

        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task PostAnalyze_ZeroChords_ReturnsProblemDetailsSchema()
    {
        var response = await PostAnalyzeAsync("""{"chords": []}""");

        var json = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp));
        Assert.Equal(400, statusProp.GetInt32());
        Assert.True(doc.RootElement.TryGetProperty("detail", out _));
    }

    [Fact]
    public async Task PostAnalyze_InvalidRootNote_ReturnsProblemDetailsContentType()
    {
        var response = await PostAnalyzeAsync("""{"chords": [{"root":"Z","quality":"Major"}]}""");

        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task PostAnalyze_InvalidPrimitiveShape_ReturnsProblemDetailsContentType()
    {
        var response = await PostAnalyzeAsync("""{"chords": [{"root":"C","quality":"Major","primitiveShape":"hexagon"}]}""");

        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
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
    public async Task PostAnalyze_CustomNotesValid_Returns200()
    {
        var response = await PostAnalyzeAsync(
            """{"chords": [{"root":"C","quality":"Major","customNotes":[0,4,7]}]}""");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
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
        Assert.Equal(ChordQuality.Major, dto.Steps[0].From.Quality);
        Assert.Equal("G", dto.Steps[0].To.Root);
        Assert.Equal(ChordQuality.Major, dto.Steps[0].To.Quality);
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

    // ── Quartal chord support ─────────────────────────────────────────────────

    [Fact]
    public async Task PostAnalyze_QuartalQuality_Returns200()
    {
        var response = await PostAnalyzeAsync("""{"chords": [{"root":"C","quality":"Quartal"}]}""");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task PostAnalyze_LowercaseQuartalQuality_Returns200()
    {
        var response = await PostAnalyzeAsync("""{"chords": [{"root":"C","quality":"quartal"}]}""");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task PostAnalyze_ExceedsRateLimit_Returns429()
    {
        var body = """{"chords": [{"root":"C","quality":"Major"}]}""";
        HttpStatusCode? terminalStatusCode = null;

        for (int i = 0; i < 70; i++)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, "/Progression/analyze")
            {
                Content = new StringContent(body, Encoding.UTF8, "application/json")
            };
            request.Headers.Add("X-RateLimit-Key", "integration-rate-limit-test");

            var response = await _client.SendAsync(request);
            terminalStatusCode = response.StatusCode;
            if (response.StatusCode == HttpStatusCode.TooManyRequests)
                break;
        }

        Assert.Equal(HttpStatusCode.TooManyRequests, terminalStatusCode);
    }

    [Fact]
    public async Task PostAnalyze_UnhandledException_Returns500WithTraceId()
    {
        using var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Production");
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IProgressionService>();
                services.AddSingleton<IProgressionService, ThrowingProgressionService>();
            });
        });

        using var client = factory.CreateClient();
        var response = await client.PostAsync(
            "/Progression/analyze",
            new StringContent("""{"chords":[{"root":"C","quality":"Major"}]}""", Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);

        var json = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(json);
        Assert.Equal(500, doc.RootElement.GetProperty("status").GetInt32());
        Assert.Equal("An unexpected error occurred.", doc.RootElement.GetProperty("title").GetString());

        var traceId = doc.RootElement.GetProperty("traceId").GetString();
        Assert.False(string.IsNullOrWhiteSpace(traceId));
    }

    // ── Lowercase frontend quality strings ────────────────────────────────────

    [Theory]
    [InlineData("major")]
    [InlineData("minor")]
    [InlineData("dim")]
    [InlineData("aug")]
    [InlineData("dom7")]
    [InlineData("maj7")]
    [InlineData("min7")]
    [InlineData("halfdim7")]
    [InlineData("quartal")]
    public async Task PostAnalyze_FrontendLowercaseQuality_Returns200(string quality)
    {
        var body = $$"""{"chords": [{"root":"C","quality":"{{quality}}"}]}""";
        var response = await PostAnalyzeAsync(body);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
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

    private sealed class ThrowingProgressionService : IProgressionService
    {
        public ProgressionAnalyzeResponseDto Analyze(List<ChordRef> chords)
            => throw new InvalidOperationException("Simulated unhandled exception for integration testing.");
    }
}
