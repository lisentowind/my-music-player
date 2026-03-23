# Tauri + Vue 3 + TypeScript Desktop App Design

Date: 2026-03-23

## Summary

Create a fresh desktop application scaffold in this repository using Tauri, Vue 3, TypeScript, and pnpm. The project should include common baseline capabilities so it is ready for business development immediately instead of starting from a bare demo.

## Goals

- Bootstrap a runnable Tauri desktop app in the current repository
- Use Vue 3, TypeScript, and Vite for the frontend
- Add common baseline capabilities: Vue Router, Pinia, UnoCSS, and Less
- Establish a clean project structure that is easy to extend
- Add basic engineering setup for linting, formatting, aliases, and common scripts
- Keep the native Rust side minimal and stable for the first iteration

## Non-Goals

- Introduce a heavy UI component library
- Add i18n, auto-update, database, or persistence layers in the initial scaffold
- Add complex Rust commands or plugin integrations before they are needed
- Turn the starter into a full admin template with extra pages and unused abstractions

## Recommended Approach

Use the official Tauri app generator with the Vue 3 + TypeScript + Vite stack, then layer the baseline frontend capabilities on top.

### Alternatives Considered

1. Official scaffold plus manual enhancement
   Recommended because it follows upstream defaults, reduces compatibility risk, and keeps upgrades straightforward.

2. Official scaffold plus a ready-made dashboard template
   Faster to get a richer UI shell, but often introduces desktop-irrelevant abstractions and more cleanup work.

3. Full manual setup from an empty repository
   Highest flexibility, but more error-prone and less aligned with Tauri's expected setup.

## Architecture

### Frontend

- Build tool: Vite
- Framework: Vue 3
- Language: TypeScript
- Routing: Vue Router
- State: Pinia
- Styling:
  - UnoCSS for layout, spacing, utility-driven UI, and fast iteration
  - Less for theme variables, shared style tokens, and complex or global styles

### Desktop Shell

- Framework: Tauri
- Native layer remains close to the generated default
- Rust configuration is limited to the minimum needed for development and packaging

## Project Structure

The project should use a practical, business-ready structure with clear ownership boundaries:

```text
src/
  app/
  components/
  router/
  stores/
  styles/
  views/
  assets/
  main.ts
  App.vue
src-tauri/
docs/
```

### Directory Intent

- `src/app`: app bootstrap helpers and global setup
- `src/components`: reusable UI components
- `src/router`: router declaration and route modules
- `src/stores`: Pinia stores
- `src/styles`: UnoCSS and Less entry points, variables, and shared styles
- `src/views`: page-level views such as Home and About
- `src-tauri`: Tauri configuration and native shell code

## Initial Product Surface

The generated app should be more useful than a blank demo while staying lightweight.

### Included by Default

- A desktop-oriented home page
- An About page to validate routing structure
- A simple Pinia example store
- A Tauri connectivity example on the home page
- Global style setup using UnoCSS and Less
- Common package scripts for:
  - frontend dev
  - tauri dev
  - build
  - lint
  - format

### Home Page Expectations

The home page should act as a practical starter shell:

- Show app title and short project description
- Surface lightweight runtime or environment information
- Demonstrate a simple Tauri interaction
- Reserve a clear content area that can be replaced by future business modules

## Tooling and Configuration

### Package Management

- Package manager: pnpm

### Code Quality

- ESLint for lint rules
- Prettier for formatting
- TypeScript path alias support for cleaner imports

### Styling Strategy

- UnoCSS handles most day-to-day UI composition
- Less provides:
  - theme variables
  - shared mixins or tokens if needed
  - global or complex styles that are awkward in utility classes

This split keeps the codebase fast to build in while preserving structure where utility classes alone would become noisy.

## Implementation Notes

- Start from the official Tauri generator rather than assembling dependencies by hand
- Prefer minimal deviation from generated Tauri files unless there is a strong reason
- Add frontend dependencies incrementally and keep each integration obvious
- Avoid overengineering the starter with speculative abstractions

## Verification Criteria

The initial scaffold is considered successful when:

- Dependencies install successfully with pnpm
- Frontend development starts successfully
- Tauri development starts successfully
- Lint and format commands run successfully
- Routing, state, UnoCSS, and Less are all wired into the app
- The repository contains a clear foundation for continued desktop app development

## Risks and Mitigations

### Risk: Generator output differs from expected defaults

Mitigation: inspect generated files before layering new tooling and adapt to current upstream output instead of assuming older templates.

### Risk: Styling setup overlaps or becomes inconsistent

Mitigation: define a clear responsibility split between UnoCSS and Less from the start.

### Risk: Starter becomes too heavy

Mitigation: limit the first version to routing, state, styling, linting, and formatting only.

## Open Decisions Resolved

- Package manager: pnpm
- Utility styling engine: UnoCSS
- CSS preprocessor support: Less
- Scope: include common baseline capabilities rather than a bare scaffold

## Next Step

After spec approval, create an implementation plan for:

1. Bootstrapping the official Tauri + Vue 3 + TypeScript app
2. Integrating router, state, UnoCSS, and Less
3. Establishing project structure and quality tooling
4. Verifying development and quality commands
