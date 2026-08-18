## Summary

<!-- Briefly describe what this PR changes and why. -->

## Documentation

- [ ] Documentation updated (updated relevant files in `docs/`, `README.md`, `ARCHITECTURE.md`, or inline code comments)
- [ ] No documentation changes required (no user-visible behaviour change, no new API surface, no new feature)

## Testing

- [ ] Unit tests added or updated
- [ ] Manual testing performed

## Checklist

- [ ] Lint passes (`cd client && npm run lint`)
- [ ] Frontend tests pass (`cd client && npm test`)
- [ ] Backend tests pass (`cd server/ParametricMusic.Tests && dotnet test`)
- [ ] API client regenerated if backend endpoints changed (`cd client && npm run generate:api`)
- [ ] Responsive UI changes use container queries first for component-level adaptation; media queries are limited to page-shell or environment-driven behavior
