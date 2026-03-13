using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Text;
using System.Text.Json;

public class ScaleControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
    };

    public ScaleControllerIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    // ── 200 OK cases ──────────────────────────────────────────────────────────

    [Theory]
    [InlineData("C", "Major",         new[] { 0, 2, 4, 5, 7, 9, 11 })]
    [InlineData("C", "NaturalMinor",  new[] { 0, 2, 3, 5, 7, 8, 10 })]
    [InlineData("C", "HarmonicMinor", new[] { 0, 2, 3, 5, 7, 8, 11 })]
    [InlineData("C", "MelodicMinor",  new[] { 0, 2, 3, 5, 7, 9, 11 })]
    [InlineData("C", "Dorian",        new[] { 0, 2, 3, 5, 7, 9, 10 })]
    [InlineData("C", "Phrygian",      new[] { 0, 1, 3, 5, 7, 8, 10 })]
    [InlineData("C", "Lydian",        new[] { 0, 2, 4, 6, 7, 9, 11 })]
    [InlineData("C", "Mixolydian",    new[] { 0, 2, 4, 5, 7, 9, 10 })]
    public async Task PostScaleFromRoot_RootC_AllModes_Returns200WithExpectedPitchClasses(
        string note, string scaleType, int[] expectedPitchClasses)
    {
        var response = await PostScaleAsync(note, scaleType);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var notes = await DeserializeNoteInfoArray(response);
        Assert.NotNull(notes);
        Assert.Equal(expectedPitchClasses, notes!.Select(n => n.Index));
    }

    // ── 400 Bad Request cases ─────────────────────────────────────────────────

    [Fact]
    public async Task PostScaleFromRoot_InvalidScaleType_Returns400()
    {
        var body = """{"scaleType": "InvalidMode"}""";
        var response = await _client.PostAsync(
            "/Scale/from-root?note=C",
            new StringContent(body, Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PostScaleFromRoot_InvalidNote_Returns400()
    {
        var response = await PostScaleAsync("Z", "Major");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ── Problem Details – content-type and schema ──────────────────────────────

    [Fact]
    public async Task PostScaleFromRoot_InvalidNote_ReturnsProblemDetailsContentType()
    {
        var response = await PostScaleAsync("Z", "Major");

        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task PostScaleFromRoot_InvalidNote_ReturnsProblemDetailsSchema()
    {
        var response = await PostScaleAsync("Z", "Major");

        var json = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp));
        Assert.Equal(400, statusProp.GetInt32());
        Assert.True(doc.RootElement.TryGetProperty("title", out _));
    }

    [Fact]
    public async Task PostScaleFromRoot_InvalidScaleType_ReturnsProblemDetailsContentType()
    {
        var body = """{"scaleType": "InvalidMode"}""";
        var response = await _client.PostAsync(
            "/Scale/from-root?note=C",
            new StringContent(body, Encoding.UTF8, "application/json"));

        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Task<HttpResponseMessage> PostScaleAsync(string note, string scaleType)
    {
        var body = $$"""{"scaleType": "{{scaleType}}"}""";
        return _client.PostAsync(
            $"/Scale/from-root?note={note}",
            new StringContent(body, Encoding.UTF8, "application/json"));
    }

    private static async Task<NoteInfo[]?> DeserializeNoteInfoArray(HttpResponseMessage response)
    {
        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<NoteInfo[]>(json, JsonOptions);
    }
}
