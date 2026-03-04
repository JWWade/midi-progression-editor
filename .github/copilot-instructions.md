# Copilot Instructions

## Project Overview

This is a **Parametric MIDI Sequencer** — a web-based prototype for editing MIDI chord progressions. It consists of a React/TypeScript frontend and an ASP.NET Core backend.

## Repository Structure

```
midi-progression-editor/
├── client/          # React + TypeScript + Vite frontend
│   ├── src/         # Application source files (.tsx, .ts)
│   ├── public/      # Static assets
│   └── package.json
└── server/
    └── ParametricMusic.Api/   # ASP.NET Core (.NET 10) Web API
        ├── Controllers/       # API controllers
        └── Program.cs         # App entry point
```

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: ASP.NET Core Web API, .NET 10, Swashbuckle (Swagger)
- **Lint**: ESLint with typescript-eslint, eslint-plugin-react-hooks

## Local Development

### Backend

```bash
cd server/ParametricMusic.Api
dotnet run
```

- Swagger UI: `http://localhost:{port}/swagger`
- Health check: `GET http://localhost:{port}/health`

### Frontend

```bash
cd client
npm install
npm run dev
```

- App: `http://localhost:5173`

## Build

### Frontend

```bash
cd client
npm run build
```

### Backend

```bash
cd server/ParametricMusic.Api
dotnet build
```

## Lint

### Frontend

```bash
cd client
npm run lint
```

ESLint is configured with zero warnings allowed (`--max-warnings=0`). All TypeScript files under `client/src/` must pass the lint check.

## Coding Conventions

- **TypeScript**: Strict mode is enabled. Use explicit types and avoid `any`.
- **React**: Use functional components with hooks. No class components.
- **C#**: Nullable reference types are enabled (`<Nullable>enable</Nullable>`). Use implicit usings.
- **API**: Follow RESTful conventions. Add new endpoints as controllers under `server/ParametricMusic.Api/Controllers/`.
- **CORS**: The backend allows requests from `http://localhost:5173` (the Vite dev server) during local development.
- **No test framework is currently set up**; add tests in a style consistent with the existing project structure when test infrastructure is added.
