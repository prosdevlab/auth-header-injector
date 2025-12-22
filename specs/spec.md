# Auth Header Injector - Specification

**Version:** 0.1.0  
**Status:** In Development  
**Last Updated:** December 20, 2025  
**Target Architecture:** Side Panel (unified interface)

---

## Development Status

### ✅ Completed
- Background service worker with SDK Kit plugins
  - Chrome Storage Plugin
  - Pattern Matcher Plugin
  - Request Interceptor Plugin
- Shared types and utilities
- Component library (Shadcn UI setup)
- Custom React hooks

### 🔄 In Progress
- Side panel UI implementation
- Context-aware rule display
- Inline rule management

### 📋 This Spec Describes
This specification describes the **target architecture** using Chrome Side Panel.
All components, workflows, and UX patterns documented here reflect the side panel approach.

---

## Overview

Auth Header Injector is a Chrome extension that automatically injects authentication headers into HTTP requests based on URL pattern matching. Built on SDK Kit to demonstrate Chrome extension development with plugin architecture.

---

## Goals

### Primary Goals
1. **Simplify dev workflow** - No manual header copying in DevTools/Postman
2. **Pattern-based injection** - Match URLs by substring/wildcard patterns
3. **Demonstrate SDK Kit** - Show Chrome extension + SDK Kit integration
4. **Starter kit foundation** - Build clean architecture for future template

### Non-Goals
- Complex regex patterns (Manifest V3 limitations)
- Response modification (Phase 2 feature)
- Multiple header types (focus on Auth only for MVP)
- Cross-browser support (Chrome only for MVP)

---

## User Stories

### Story 1: Developer Testing APIs
**As a** frontend developer  
**I want to** automatically inject my JWT token into API requests  
**So that** I don't have to manually add headers in Postman/DevTools

**Acceptance Criteria:**
- Can set a token in options
- Can add URL patterns (e.g., "api.staging.com")
- Token automatically added to matching requests
- Works across all tabs

---

### Story 2: Managing Multiple Environments
**As a** full-stack developer  
**I want to** configure different tokens for different environments  
**So that** I can test localhost, staging, and production without switching

**Acceptance Criteria:**
- Can create multiple rules (pattern + token pairs)
- Each rule can be enabled/disabled independently
- Rules are synced across Chrome instances

---

### Story 3: Quick Enable/Disable
**As a** developer  
**I want to** quickly toggle the extension on/off  
**So that** I can test with and without injected headers

**Acceptance Criteria:**
- Global enable/disable toggle in side panel
- Visual indicator when active
- Remembers state across sessions

---

## Architecture

### Tech Stack
- **Framework:** SDK Kit (plugin architecture for background worker)
- **UI Framework:** React 19 + Shadcn UI (Radix UI components)
- **UI Pattern:** Chrome Side Panel (persistent dev tool)
- **Styling:** Tailwind CSS
- **State Management:** React useState + custom hooks (no external library)
- **Build:** Vite + TypeScript
- **Manifest:** Chrome Manifest V3
- **API:** `chrome.declarativeNetRequest` for header injection, `chrome.sidePanel` for UI
- **Storage:** `chrome.storage.sync` for persistence
- **Minimum Chrome Version:** 114+ (for side panel support)

### Components

```
auth-header-injector/
├── src/
│   ├── background/              # Service worker (SDK Kit + plugins)
│   │   ├── index.ts            # SDK instance + plugin registration
│   │   └── plugins/            # Chrome SDK Kit plugins
│   │       ├── chromeStorage.ts       # Wraps chrome.storage.sync
│   │       ├── requestInterceptor.ts  # Wraps declarativeNetRequest
│   │       └── patternMatcher.ts      # URL pattern matching
│   ├── panel/                  # Side panel (unified interface)
│   │   ├── index.html
│   │   ├── App.tsx             # Main panel component
│   │   ├── components/         # Panel-specific components
│   │   │   ├── CurrentPage.tsx      # Context-aware page info
│   │   │   ├── RuleList.tsx         # All rules management
│   │   │   ├── RuleCard.tsx         # Individual rule display
│   │   │   ├── RuleForm.tsx         # Inline rule editing
│   │   │   └── ui/                  # Shadcn primitives (Button, Switch, etc.)
│   │   └── hooks/              # Custom React hooks
│   │       ├── useAuthRules.ts
│   │       ├── useExtensionEnabled.ts
│   │       ├── useCurrentTab.ts
│   │       └── useMatchedRules.ts
│   ├── shared/                 # Shared code
│   │   ├── types.ts            # TypeScript types
│   │   └── lib/                # Utilities
│   │       └── utils.ts        # Shadcn utils (cn helper)
│   └── manifest.json           # Chrome manifest
├── specs/                      # Specifications
├── tailwind.config.ts          # Tailwind configuration
├── postcss.config.js           # PostCSS configuration
└── package.json
```

---

## Core Features

### Feature 1: Auth Rule Management

**Description:** Create, update, delete auth rules (pattern + token pairs)

**Data Model:**
```typescript
interface AuthRule {
  id: string;              // UUID
  pattern: string;         // URL pattern (substring match)
  token: string;           // Auth token (stored securely)
  label?: string;          // Optional friendly name (e.g., "Staging API")
  enabled: boolean;        // Rule on/off
  createdAt: number;       // Timestamp
  updatedAt: number;       // Timestamp
}
```

**Storage:**
- Stored in `chrome.storage.sync` (syncs across devices)
- Key: `auth_rules`
- Max: 300 rules (chrome.declarativeNetRequest limit)

---

### Feature 2: Pattern Matching

**Description:** Match URLs to determine which rules apply

**Pattern Types (MVP):**
- Substring match: `"api.staging.com"` matches any URL containing that string
- Wildcard support: `"*.myapp.com"` matches all subdomains

**Chrome API:**
```javascript
{
  condition: {
    urlFilter: pattern,  // Chrome's built-in matching
    resourceTypes: ['xmlhttprequest', 'main_frame', 'sub_frame']
  }
}
```

**Out of Scope (MVP):**
- Regex patterns
- Complex AND/OR logic
- Custom JavaScript conditions

---

### Feature 3: Header Injection

**Description:** Inject `Authorization` header into matching requests

**Implementation:**
- Use `chrome.declarativeNetRequest.updateDynamicRules()`
- Operation: `'set'` (add if missing, replace if exists)
- Format: `Authorization: Bearer {token}`

**Behavior:**
```
Request: GET https://api.staging.com/users
Pattern: "api.staging.com"
Token: "abc123"

→ Injects: Authorization: Bearer abc123
```

---

### Feature 4: Side Panel UI

**Description:** Unified interface for status, management, and context-aware rule display. Built with React + Shadcn UI as a Chrome Side Panel.

**Why Side Panel:**
- Stays open while browsing (persistent context)
- More space than popup (300-800px resizable)
- No separate options page needed (everything in one place)
- Context-aware (updates as you navigate)
- Native Chrome UX (collapsible, resizable)
- Perfect for developer workflow

**Layout:**
```
┌─────────────────────────────────────┐
│  Auth Header Injector               │
│  [x] Extension Active               │
├─────────────────────────────────────┤
│  🌐 Current Page                    │
│     www.github.com                  │
│     ● 2 rules active                │
├─────────────────────────────────────┤
│  Active on This Page                │
│  ┌─────────────────────────────┐    │
│  │ GitHub Dev                   │    │
│  │ *.github.com                 │    │
│  │ Bearer ghp_...  [📋] [x] On │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ GitHub Personal              │    │
│  │ *github.com/personal/*       │    │
│  │ Bearer ghp_...  [📋] [x] On │    │
│  └─────────────────────────────┘    │
├─────────────────────────────────────┤
│  All Rules (3 total)                │
│  [+ Add New Rule]                   │
│  ┌─────────────────────────────┐    │
│  │ Staging API                  │    │
│  │ *.staging.com                │    │
│  │ [✏️] [🗑️] [ ] Off            │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**Sections:**

1. **Header**
   - Extension name
   - Global enable/disable toggle
   - Always visible

2. **Current Page Context** (Context-Aware)
   - Shows current tab URL/hostname
   - Indicator: green dot = rules active, gray = no match
   - Quick "Add rule for [domain]" button if no match

3. **Active Rules** (Context-Aware)
   - Shows ONLY rules matching current page
   - Each rule card shows:
     - Label (if set) - prominent
     - Pattern - secondary
     - Token preview with copy button
     - Quick toggle switch
   - Empty state if no matches

4. **All Rules**
   - Complete list of all configured rules
   - Each rule card shows:
     - Label (if set)
     - Pattern
     - Token (masked, with show/hide)
     - Edit button (inline editing)
     - Delete button (with confirmation)
     - Enable/disable toggle
   - Add new rule button
   - Collapsible section (optional)

**Components (Shadcn UI):**
- Switch (global enable, per-rule toggle)
- Button (add, edit, delete, copy)
- Input (pattern, token, label fields)
- Card (rule display)
- Dialog (delete confirmation)
- Collapsible (optional for sections)
- Label, Form components

**State Management:**
```typescript
// Custom hooks (no external state library)
const { rules, loading, addRule, updateRule, deleteRule } = useAuthRules();
const { isEnabled, toggle } = useExtensionEnabled();
const { tab, loading: tabLoading } = useCurrentTab();
const matchedRules = useMatchedRules(rules, tab.url);
```

**Features:**
- ✅ Context-aware matching (shows current page)
- ✅ Inline rule management (no separate page)
- ✅ Quick toggle rules on/off
- ✅ Copy token to clipboard
- ✅ Rule labels for easy identification
- ✅ Add rule for current domain (one-click)
- ✅ Real-time validation
- ✅ Persistent while browsing
- ✅ Collapsible (Chrome built-in)
- ✅ Resizable (Chrome built-in)
- ✅ Accessible (Radix UI ARIA compliant)

**Manifest Configuration:**
```json
{
  "side_panel": {
    "default_path": "src/panel/index.html"
  },
  "permissions": ["sidePanel", "tabs", ...]
}
```

**Opening Side Panel:**
```typescript
// User clicks extension icon
chrome.action.onClicked.addListener(() => {
  chrome.sidePanel.open({ windowId: currentWindow });
});
```

---

## Plugin Architecture (Chrome SDK Kit)

### Plugin 1: Chrome Storage Plugin

**Purpose:** Wrap `chrome.storage.sync` in SDK Kit pattern

**API:**
```typescript
sdk.storage.get<T>(key: string): Promise<T | null>
sdk.storage.set<T>(key: string, value: T): Promise<void>
sdk.storage.remove(key: string): Promise<void>
sdk.storage.clear(): Promise<void>
```

**Events:**
- `storage:get`
- `storage:set`
- `storage:remove`
- `storage:error`

---

### Plugin 2: Request Interceptor Plugin

**Purpose:** Wrap `chrome.declarativeNetRequest` for header injection

**API:**
```typescript
sdk.interceptor.enable(): Promise<void>
sdk.interceptor.disable(): Promise<void>
sdk.interceptor.updateRules(): Promise<void>
sdk.interceptor.getRuleCount(): Promise<number>
```

**Events:**
- `interceptor:enabled`
- `interceptor:disabled`
- `interceptor:rules-updated`
- `interceptor:error`

**Dependencies:**
- Requires `storage` plugin
- Requires `matcher` plugin

---

### Plugin 3: Pattern Matcher Plugin

**Purpose:** URL pattern matching utilities

**API:**
```typescript
sdk.matcher.matches(url: string, patterns: string[]): boolean
sdk.matcher.validate(pattern: string): boolean
```

**Events:**
- `matcher:matched`
- `matcher:no-match`

---

## Security Considerations

### Token Storage
- ✅ Stored in `chrome.storage.sync` (Chrome's secure storage)
- ✅ Not accessible to web pages (extension-only)
- ⚠️ Visible in side panel UI (with show/hide toggle)
- ⚠️ Not encrypted at rest (Chrome responsibility)

### Permissions
- `declarativeNetRequest` - Header modification
- `storage` - Persist settings
- `<all_urls>` - Match any domain (user controls patterns)

### Privacy
- ❌ No analytics
- ❌ No external network requests
- ✅ All data stays local (chrome.storage.sync)

---

## User Experience

### Installation Flow
1. Install from Chrome Web Store (or load unpacked)
2. Extension icon appears in toolbar
3. Click icon → Side panel slides in from right
4. See empty state: "No rules yet"
5. Click "Add rule for [current-domain]"
6. Fill inline form (label, pattern, token)
7. Save → Rule appears in list
8. Start using!

### Daily Workflow
```
Morning:
- Click extension icon → Panel opens
- See all rules, verify setup
- Keep panel open while working

Browsing:
- Navigate to github.com
- Panel updates: "2 rules active"
- See which rules are injecting
- Toggle specific rule off to test
- Toggle back on

Need screen space:
- Click [<] button → Panel collapses (0px)
- Work with full screen
- Click icon → Panel reopens (same state)

Token expired:
- Click edit button on rule
- Update token inline
- Save → Injection resumes
```

### Empty State
- Side panel shows friendly "No rules yet"
- Clear CTA: "Add rule for [current-domain]"
- Alternative: "Add New Rule" for custom pattern

### Error Handling
- Invalid pattern → Show validation message inline
- Empty token → Require value
- Duplicate pattern → Warn user
- Storage full → Show error (unlikely, 8KB limit)

### Collapsible Behavior
- Click `[<]` → Panel slides out completely (0px)
- Click extension icon → Panel slides back in (previous state)
- Chrome remembers width (user can resize)
- Panel persists across tab switches

---

## Future Phases

### Phase 2: Enhanced Features
- Custom header names (not just Authorization)
- Multiple headers per rule
- Request/response logging
- Export/import rules (JSON)

### Phase 3: Requestly-lite
- Response modification (mock APIs)
- Script injection
- Query param modification
- Redirect rules

### Phase 4: Chrome Extension Starter Kit
- Extract to template
- CLI scaffolding
- Multiple example plugins

---

## Success Metrics

### MVP Success (Phase 1)
- ✅ Can add/edit/delete rules (inline in side panel)
- ✅ Headers injected correctly
- ✅ Rules persist across sessions
- ✅ Context-aware (shows current page status)
- ✅ Works in Chrome 114+ (side panel support)
- ✅ Clean code (starter kit ready)
- ✅ Unified interface (no separate options page)

### Adoption Success (Post-launch)
- 100+ Chrome Web Store installs
- Positive reviews (4+ stars)
- GitHub stars/forks
- Referenced as SDK Kit example
- Developer testimonials about workflow improvement

---

## Open Questions

1. **Should we support HTTP Basic Auth?** (e.g., `Basic base64(user:pass)`)
   - Decision: Phase 2, focus on Bearer tokens for MVP

2. **Should we support custom header names?**
   - Decision: Phase 2, start with Authorization only

3. **Should we validate token format?**
   - Decision: No, users might have custom formats

4. **Should we support environment presets?** (e.g., "Staging", "Production")
   - Decision: Nice to have, Phase 2

5. **Should we show matched requests in side panel?**
   - Decision: Phase 2 (requires logging)

6. **Bundle size with React + Shadcn?**
   - React ~45KB, Radix ~20KB, Tailwind CSS ~10KB = ~75KB gzipped
   - Decision: Acceptable for Chrome extension (most are 1-5MB)
   - Trade-off: Beautiful UI + fast development vs. bundle size

---

## References

- [SDK Kit Repository](https://github.com/lytics/sdk-kit)
- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [chrome.declarativeNetRequest](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest)
- [chrome.storage](https://developer.chrome.com/docs/extensions/reference/api/storage)

