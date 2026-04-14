# Architecture Diagrams

This folder contains architecture-as-code diagrams for the Parametric MIDI Sequencer.
All diagrams are written in [Mermaid](https://mermaid.js.org/) and render natively in GitHub.

---

## Diagrams

| File | Description |
|------|-------------|
| [system-overview.md](system-overview.md) | Full system topology: browser, frontend, backend, services, MIDI output |
| [frontend-features.md](frontend-features.md) | Frontend feature module dependencies and data flows |
| [data-flow.md](data-flow.md) | End-to-end data flow from user interaction to MIDI file output |
| [ci-pipeline.md](ci-pipeline.md) | CI/CD pipeline stages and jobs |

---

## Updating Diagrams

Diagrams live alongside the code they describe. When you add a new feature module,
change the data model, or modify the CI pipeline, update the relevant diagram in this
folder as part of the same pull request.

Use the [Mermaid Live Editor](https://mermaid.live) to preview changes locally before committing.
