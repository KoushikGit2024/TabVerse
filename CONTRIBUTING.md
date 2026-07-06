# Contributing to TabVerse Engine (TVE)

Thank you for your interest in contributing to TabVerse Engine!

## Core Principles
1. **The Engine Should Not Know About the Browser DOM:** The engine must remain headless and mathematical. Input and visualization should be handled by `examples/` or consumer applications via `HostAdapter`.
2. **Immutable Geometry:** Always prefer creating a new `WorldGeometry` object rather than mutating an existing one.
3. **No Hidden State:** Expose diagnostic insights into subsystem behavior via `EventBus` without letting the subsystem know it's being watched.

## Development Workflow
1. Fork and clone the repository.
2. Run `npm install` in the root to install workspaces.
3. Make your changes in `packages/engine`.
4. Test your changes against `examples/bouncing-balls` using `npm run dev`.
5. Run the test suite with `npm run test`.
6. Submit a Pull Request.
