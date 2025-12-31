# Claude AI Assistant Rules

Guidelines for AI-assisted development in this codebase.

## Code Style & Formatting

- **Biome** for linting and formatting
  - Single quotes
  - 2 space indentation
  - 100 character line width
  - Auto-format on save
- **TypeScript** strict mode
- **Pure functions** preferred for testability (extract to `utils/`)

## UI Component Guidelines

- **Use shadcn UI components** (Alert, Button, Dialog, Select, Switch, etc.)
- **Use Lucide icons** for all iconography
- **Extract stateless components** for reusability
- Consistent Tailwind CSS styling

## Architecture Patterns

- **SDK Kit plugin architecture** for background service worker
- **Pure functions** in `utils/` for testability
- **React hooks** for state management (no external state library)
- **Separation of concerns:**
  - `background/` - Service worker with SDK Kit plugins
  - `panel/` - Side panel UI
  - `popup/` - Popup UI
  - `options/` - Options page UI
  - `shared/` - Shared types and utilities

## Chrome Extension Specifics

- **Manifest V3** patterns
- **`declarativeNetRequest`** API for header injection
- **Priority-based rule ordering** using pattern specificity
- **Storage:**
  - `chrome.storage.sync` for rules (synced across devices)
  - `chrome.storage.local` for stats (device-specific)
- **⚠️ CRITICAL: New changes must NOT affect permissions**
  - Adding new permissions requires Chrome Web Store review
  - Check `manifest.json` before making changes that might require new permissions
  - If permissions are needed, discuss first before implementing

## Testing Guidelines

- **Vitest** for unit tests
- **Test pure functions** - extract to `utils/` for testability
- **Mock Chrome APIs** in `tests/setup.ts`
- **Colocate tests** with source files (`.test.ts`)

## Git & Versioning

- **Conventional commits** (feat, fix, docs, refactor, test, chore)
- **Manual versioning** (no changesets yet - will add when auto-deploying to Chrome Web Store)
- **Ask before performing git actions** (user preference)

## Code Review Checklist

Before submitting code, ensure:
- ✅ Pure functions extracted for testability
- ✅ Uses shadcn UI components
- ✅ Uses Lucide icons (not emojis)
- ✅ Tests added for new functionality
- ✅ No new permissions required (check `manifest.json`)
- ✅ TypeScript types are correct
- ✅ Follows existing patterns and conventions

