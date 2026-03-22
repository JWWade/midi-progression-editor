using ParametricMusic.Api.Models;

namespace ParametricMusic.Api.Services;

/// <summary>
/// Defines the harmony-engine contract for building tertian chords from a root note and quality.
/// </summary>
/// <remarks>
/// Register as a singleton via DI so controllers can receive it by constructor injection.
/// This interface is the stable boundary between the HTTP layer and the chord-building algorithm;
/// swap the implementation without touching controllers or tests that use the interface.
/// </remarks>
public interface IChordService
{
    /// <summary>
    /// Builds a chord DTO from a root note and chord quality by applying the standard
    /// Western tertian interval stack.
    /// </summary>
    /// <param name="root">The root note of the chord.</param>
    /// <param name="quality">The chord quality, determining the interval pattern.</param>
    /// <returns>
    /// A <see cref="ChordDto"/> containing root name, quality, display name, pitch classes,
    /// and note names.
    /// </returns>
    ChordDto BuildChord(Note root, ChordQuality quality);
}
