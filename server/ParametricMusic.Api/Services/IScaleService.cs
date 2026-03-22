using ParametricMusic.Api.Models;

namespace ParametricMusic.Api.Services;

/// <summary>
/// Defines the harmony-engine contract for building diatonic scales from a root and mode.
/// </summary>
/// <remarks>
/// Register as a singleton via DI so controllers can receive it by constructor injection.
/// This interface is the stable boundary between the HTTP layer and the scale-building algorithm;
/// swap the implementation without touching controllers or tests that use the interface.
/// </remarks>
public interface IScaleService
{
    /// <summary>
    /// Builds a scale from a root pitch-class index and scale type by applying the corresponding
    /// diatonic or modal interval pattern.
    /// </summary>
    /// <param name="root">The root pitch-class index (0 = C, 1 = C♯/D♭, …, 11 = B).</param>
    /// <param name="scaleType">The scale type, selecting the interval pattern to apply.</param>
    /// <returns>
    /// An array of <see cref="NoteInfo"/> values representing the scale tones in ascending order.
    /// </returns>
    NoteInfo[] BuildScale(int root, ScaleType scaleType);
}
