# Auth Header Injector - Specification

**Version:** 0.1.0  
**Status:** Draft  
**Last Updated:** December 19, 2025

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
- Global enable/disable toggle in popup
- Visual indicator when active
- Remembers state across sessions

---

## Architecture

### Tech Stack
- **Framework:** SDK Kit (plugin architecture for background worker)
- **UI Framework:** React 19 + Shadcn UI (Radix UI components)
- **Styling:** Tailwind CSS
- **State Management:** React useState + custom hooks (no external library)
- **Build:** Vite + TypeScript
- **Manifest:** Chrome Manifest V3
- **API:** `chrome.declarativeNetRequest` for header injection
- **Storage:** `chrome.storage.sync` for persistence

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
│   ├── options/                # Settings page (React + Shadcn)
│   │   ├── index.html
│   │   ├── App.tsx             # Main options component
│   │   ├── components/         # Shadcn UI components
│   │   │   ├── RuleList.tsx
│   │   │   ├── RuleForm.tsx
│   │   │   └── ui/            # Shadcn primitives (Button, Switch, etc.)
│   │   └── hooks/              # Custom React hooks
│   │       ├── useAuthRules.ts
│   │       └── useExtensionEnabled.ts
│   ├── popup/                  # Quick toggle UI (React + Shadcn)
│   │   ├── index.html
│   │   ├── App.tsx             # Main popup component
│   │   └── components/         # Popup-specific components
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

### Feature 4: Options Page

**Description:** Full-featured settings UI built with React + Shadcn UI

**Layout:**
```
┌─────────────────────────────────────┐
│  Auth Header Injector - Settings    │
├─────────────────────────────────────┤
│  [x] Extension Enabled              │
│                                     │
│  Auth Rules:                        │
│  ┌─────────────────────────────┐    │
│  │ Pattern: api.staging.com    │    │
│  │ Token: ••••••••             │    │
│  │ [x] Enabled  [Edit] [Delete]│    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ Pattern: localhost:3000     │    │
│  │ Token: ••••••••             │    │
│  │ [x] Enabled  [Edit] [Delete]│    │
│  └─────────────────────────────┘    │
│                                     │
│  [+ Add New Rule]                   │
└─────────────────────────────────────┘
```

**Components (Shadcn UI):**
- Switch (global enable/disable, per-rule toggle)
- Button (add, edit, delete, save)
- Input (pattern, token fields)
- Card (rule display)
- Dialog (edit/delete confirmation)
- Label, Form components

**State Management:**
```typescript
// Custom hooks (no external state library)
const { rules, loading, addRule, updateRule, deleteRule } = useAuthRules();
const { isEnabled, toggle } = useExtensionEnabled();
```

**Features:**
- Add/edit/delete rules
- Toggle rules on/off
- Show/hide token (password field)
- Global enable/disable
- Real-time validation
- Accessible (Radix UI ARIA compliant)

---

### Feature 5: Popup UI

**Description:** Quick status and toggle built with React + Shadcn UI

**Layout:**
```
┌────────────────────────┐
│  Auth Header Injector  │
├────────────────────────┤
│  Status: [x] Active    │
│                        │
│  Active Rules: 2       │
│                        │
│  [Open Settings]       │
└────────────────────────┘
```

**Components (Shadcn UI):**
- Switch (quick toggle)
- Button (open settings)
- Badge (status indicator)

**State Management:**
```typescript
// Simple local state + message passing
const [isEnabled, setIsEnabled] = useState(false);
const [ruleCount, setRuleCount] = useState(0);

useEffect(() => {
  chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
    setIsEnabled(response.data.enabled);
    setRuleCount(response.data.ruleCount);
  });
}, []);
```

**Features:**
- Quick enable/disable toggle
- Show count of active rules
- Link to options page
- Minimal, clean design

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
- ⚠️ Visible in options page (password field with show/hide)
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
3. Click icon → See popup (empty state)
4. Click "Open Settings"
5. Add first rule
6. Start using!

### Empty State
- Options page shows friendly "No rules yet"
- Popup shows "No active rules"
- Clear CTA: "Add your first rule"

### Error Handling
- Invalid pattern → Show validation message
- Empty token → Require value
- Duplicate pattern → Warn user
- Storage full → Show error (unlikely, 8KB limit)

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
- ✅ Can add/edit/delete rules
- ✅ Headers injected correctly
- ✅ Rules persist across sessions
- ✅ Works in Chrome (latest version)
- ✅ Clean code (starter kit ready)

### Adoption Success (Post-launch)
- 100+ Chrome Web Store installs
- Positive reviews (4+ stars)
- GitHub stars/forks
- Referenced as SDK Kit example

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

5. **Should we show matched requests in popup?**
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

