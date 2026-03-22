using ParametricMusic.Api.Models;

namespace ParametricMusic.Api.Services;

/// <summary>
/// Defines the harmony-engine contract for building diatonic quartal chords from a scale.
/// </summary>
/// <remarks>
/// Register as a singleton via DI so controllers can receive it by constructor injection.
/// This interface is the stable boundary between the HTTP layer and the quartal-chord algorithm;
/// swap the implementation without touching controllers or tests that use the interface.
/// </remarks>
public interface IQuartalChordService
{
    /// <summary>
    /// Builds a diatonic quartal chord on the given scale degree by stacking diatonic fourths.
    /// </summary>
    /// <param name="root">The root pitch-class index of the scale (0 = C … 11 = B).</param>
    /// <param name="scaleType">The scale type to derive diatonic fourths from.</param>
    /// <param name="degree">The 1-based scale degree (1..7).</param>
    /// <param name="size">The number of voices to stack (default 3).</param>
    /// <returns>A <see cref="QuartalChordDto"/> containing root, note names, and quartal metadata.</returns>
    QuartalChordDto BuildDiatonicQuartal(int root, ScaleType scaleType, int degree, int size = 3);
}
