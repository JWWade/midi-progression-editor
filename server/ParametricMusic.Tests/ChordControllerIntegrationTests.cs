using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

public class ChordControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
    };

    public ChordControllerIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    // ── 200 OK cases ──────────────────────────────────────────────────────────

    [Theory]
    [InlineData("C", "Major",           new[] { 0, 4, 7 },       new[] { "C", "E", "G" })]
    [InlineData("C", "Minor",           new[] { 0, 3, 7 },       new[] { "C", "D#", "G" })]
    [InlineData("C", "Diminished",      new[] { 0, 3, 6 },       new[] { "C", "D#", "F#" })]
    [InlineData("C", "Augmented",       new[] { 0, 4, 8 },       new[] { "C", "E", "G#" })]
    [InlineData("C", "Dominant7",       new[] { 0, 4, 7, 10 },   new[] { "C", "E", "G", "A#" })]
    [InlineData("C", "Dom7Sus4",        new[] { 0, 5, 7, 10 },   new[] { "C", "F", "G", "A#" })]
    [InlineData("C", "Major7",          new[] { 0, 4, 7, 11 },   new[] { "C", "E", "G", "B" })]
    [InlineData("C", "Minor7",          new[] { 0, 3, 7, 10 },   new[] { "C", "D#", "G", "A#" })]
    [InlineData("C", "HalfDiminished7", new[] { 0, 3, 6, 10 },   new[] { "C", "D#", "F#", "A#" })]
    public async Task PostChordFromRoot_RootC_AllQualities_Returns200WithExpectedPayload(
        string note, string quality, int[] expectedPitchClasses, string[] expectedNoteNames)
    {
        var response = await PostChordAsync(note, quality);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var dto = await DeserializeChordDto(response);
        Assert.NotNull(dto);
        Assert.Equal(note, dto!.Root);
        Assert.Equal(expectedPitchClasses, dto.PitchClasses);
        Assert.Equal(expectedNoteNames, dto.NoteNames);
    }

    [Fact]
    public async Task PostChordFromRoot_RootB_MajorQuality_WrapsAroundCorrectly()
    {
        var response = await PostChordAsync("B", "Major");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var dto = await DeserializeChordDto(response);
        Assert.NotNull(dto);
        Assert.Equal("B", dto!.Root);
        Assert.Equal([11, 3, 6], dto.PitchClasses);
        Assert.Equal(["B", "D#", "F#"], dto.NoteNames);
    }

    [Fact]
    public async Task PostChordFromRoot_RootB_Dominant7_WrapsAroundCorrectly()
    {
        var response = await PostChordAsync("B", "Dominant7");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var dto = await DeserializeChordDto(response);
        Assert.NotNull(dto);
        Assert.Equal([11, 3, 6, 9], dto!.PitchClasses);
    }

    [Fact]
    public async Task PostChordFromRoot_CMajor_HasCorrectDisplayName()
    {
        var response = await PostChordAsync("C", "Major");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var dto = await DeserializeChordDto(response);
        Assert.NotNull(dto);
        Assert.Equal("C Major", dto!.DisplayName);
    }

    [Fact]
    public async Task PostChordFromRoot_InvalidNote_Returns400()
    {
        var response = await PostChordAsync("Z", "Major");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PostChordFromRoot_InvalidQuality_Returns400WithStructuredPayload()
    {
        var body = """{"quality": "InvalidQuality"}""";
        var response = await _client.PostAsync(
            "/Chord/from-root?note=C",
            new StringContent(body, Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ── Problem Details – content-type and schema ──────────────────────────────

    [Fact]
    public async Task PostChordFromRoot_InvalidNote_ReturnsProblemDetailsContentType()
    {
        var response = await PostChordAsync("Z", "Major");

        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task PostChordFromRoot_InvalidNote_ReturnsProblemDetailsSchema()
    {
        var response = await PostChordAsync("Z", "Major");

        var json = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.TryGetProperty("status", out var statusProp));
        Assert.Equal(400, statusProp.GetInt32());
        Assert.True(doc.RootElement.TryGetProperty("title", out _));
    }

    [Fact]
    public async Task PostChordFromRoot_InvalidQuality_ReturnsProblemDetailsContentType()
    {
        var body = """{"quality": "InvalidQuality"}""";
        var response = await _client.PostAsync(
            "/Chord/from-root?note=C",
            new StringContent(body, Encoding.UTF8, "application/json"));

        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task PostChordFromRoot_InvalidPrimitiveShape_ReturnsProblemDetailsContentType()
    {
        var body = """{"quality": "Major", "primitiveShape": "hexagon"}""";
        var response = await _client.PostAsync(
            "/Chord/from-root?note=C",
            new StringContent(body, Encoding.UTF8, "application/json"));

        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Task<HttpResponseMessage> PostChordAsync(string note, string quality)
    {
        var body = $$"""{"quality": "{{quality}}"}""";
        return _client.PostAsync(
            $"/Chord/from-root?note={note}",
            new StringContent(body, Encoding.UTF8, "application/json"));
    }

    private static async Task<ChordDto?> DeserializeChordDto(HttpResponseMessage response)
    {
        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<ChordDto>(json, JsonOptions);
    }
}
