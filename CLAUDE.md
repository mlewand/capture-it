# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Capture It is an Electron desktop app for instantly capturing notes into Notion. Its stated goals (from README): pop up/disappear instantly, stay simple, and be quick to extend — the source intentionally favors shortcuts over polish.

## Commands

```sh
yarn                 # install deps
yarn start:dev        # tsc build + launch Electron with NODE_ENV=development
yarn start             # tsc build + launch Electron (production-like)
yarn build             # tsc only
yarn dist              # build + electron-builder (full installer/dmg/zip)
yarn dist:mac          # build + electron-builder for mac x64/arm64
```

There is no lint or test suite configured in this repo. `postinstall` runs `electron-builder install-app-deps`.

Config for local runs: copy `.capture-it-config.tpl.json` to `~/.capture-it-config.json` and fill in Notion workspace details (the app also offers a guided setup on first run). The app watches this file and hot-reloads config changes.

## Architecture

This is a plain (non-monorepo) Electron app compiled with `tsc` (no bundler). `tsconfig.json` only lists `src/main.ts` and `app/app.ts` as entry includes; everything else is pulled in transitively. Output goes to `dist/`, mirroring `src/` and `app/`.

- **`src/`** — Electron **main process** code (TypeScript).
  - `main.ts` — loads `.env`, instantiates `CaptureIt` with the repo root path, calls `start()`.
  - `CaptureIt.ts` — the app's central class. Owns the Electron `app` lifecycle, the main `BrowserWindow`, the `Config`, the tray icon, global hotkey registration, and the `CommandSet`. Also implements a custom promise-based IPC layer (`addPromisedIpcHandler` / channels named `promised/call|then|catch/<channel>/<uuid>`) layered on top of Electron's normal `ipcMain.handle`, because some renderer→main calls need to resolve/reject a promise in the renderer.
  - `AppMainWindow.ts` — a `BrowserWindow` subclass; loads `app/index.html`, and intercepts `close` to hide the window instead of quitting (so the global hotkey can bring it back) unless `forceClose()` was called.
  - `Config.ts` — loads/saves `~/.capture-it-config.json` (JSON-with-comments via `comment-json`), exposes `workspaces`, `invocationHotKey`, etc., and emits a `changed` event (also on file-watch changes, debounced).
  - `Command/` — Command pattern: `Command` is the base class (`name` + `execute()`), `CommandSet` (a `Set<Command>`) resolves and executes commands by name. All commands take `{ app: CaptureIt }` in their constructor and reach back into the app for state/actions. Registered in `CaptureIt._initCommands()` and invoked from the renderer via the `executeCommand` / `executeCommandAsync` IPC channels. Add new user-facing actions by creating a new `Command/*.ts` and registering it there.
  - `Auth/Notion.ts` — Notion OAuth-ish flow (authenticate, exchange code for token) and page/database queries used when adding a workspace or capturing an item.
  - `preload.js` — contextBridge, exposes `window.electron` with `receive`/`send`/`invoke`/`promisedInvoke` to the renderer. `promisedInvoke` is the renderer-side counterpart to `addPromisedIpcHandler` above.
  - `helpers.ts` — tray icon setup and native menu customizations (see the platform-specific handling for macOS mentioned in recent commits — required for OS-level undo/redo to work in inputs).

- **`app/`** — Electron **renderer process** (plain HTML/CSS/TS, no framework). `app.ts` compiles alongside `src/` per `tsconfig.json`, talks to main only through `window.electron` (from `preload.js`), and manages which `<section id="...-tab">` is visible based on config/workspace state (e.g. `config-missing-tab`, `no-workspaces-tab`, `app-tab`). `add-notion-workspace.html/js` is a secondary window flow for connecting a new Notion workspace.

- **`assets/`** — icons and the tray/menu bar assets used across platforms.

- **`packages/`** — an untracked (`.gitignore`d via git status, not part of version control) scratch area containing stale build artifacts from a past monorepo experiment (mobile app, core/cli/frontend split). It is not part of the active build; the real source of truth is `src/` and `app/` at the repo root.

## Key patterns to preserve

- **IPC**: prefer the existing `executeCommand`/`executeCommandAsync` + `Command` pattern for new renderer-triggered actions in main, rather than adding ad-hoc `ipcMain.handle` channels.
- **Config as source of truth**: workspace state lives in `Config`/`~/.capture-it-config.json`; the renderer never persists state itself, it only reflects what main pushes via the `configChanged`/`activeWorkspaceIndexChanged` events.
- **Main window is hidden, not closed**: closing the window (`AppMainWindow`) hides it by default; only `CaptureIt.quit()` (via `forceClose()`) actually terminates the app. Keep this behavior when touching window lifecycle code, since it's what makes the global-hotkey show/hide UX work.
