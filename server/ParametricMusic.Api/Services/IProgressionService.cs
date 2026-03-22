using ParametricMusic.Api.Models;

namespace ParametricMusic.Api.Services;

/// <summary>
/// Defines the harmony-engine contract for analysing chord progressions.
/// </summary>
/// <remarks>
/// Register as a singleton via DI so controllers can receive it by constructor injection.
/// This interface is the stable boundary between the HTTP layer and the progression-analysis
/// algorithm; swap the implementation (e.g. to add tension-curve models) without touching
/// controllers or tests that use the interface.
/// </remarks>
public interface IProgressionService
{
    /// <summary>
    /// Analyzes a chord progression, returning voice-leading motion between consecutive chords,
    /// a continuity score derived from average motion, and a per-chord tension trend.
    /// </summary>
    /// <param name="chords">
    /// The ordered list of chords in the progression. Must contain at least one chord.
    /// </param>
    /// <returns>
    /// A <see cref="ProgressionAnalyzeResponseDto"/> with steps, continuity score, and tension trend.
    /// </returns>
    ProgressionAnalyzeResponseDto Analyze(List<ChordRef> chords);
}
