# Auth Header Injector

A Chrome extension that automatically injects authentication headers into HTTP requests based on URL patterns. Built for developers who need to test APIs with different auth tokens across multiple environments.

[![CI](https://github.com/prosdevlab/auth-header-injector/actions/workflows/ci.yml/badge.svg)](https://github.com/prosdevlab/auth-header-injector/actions/workflows/ci.yml)
![Chrome Version](https://img.shields.io/badge/chrome-v114+-blue)
![License](https://img.shields.io/badge/license-MIT-green)
[![SDK Kit](https://img.shields.io/badge/built_with-SDK_Kit-purple)](https://github.com/lytics/sdk-kit)

## Features

- 🎯 **Pattern-based matching** - Target specific domains or subdomains
- 🔐 **Bearer token injection** - Auto-inject `Authorization` headers
- 📊 **Real-time tracking** - See which requests are being intercepted
- 🎨 **Side panel UI** - Context-aware, stays open while browsing
- ⚡ **Event-driven** - Minimal performance impact with smart caching
- 🌓 **Dark mode** - Chrome DevTools-inspired aesthetic

## Installation

### From Chrome Web Store

> 🚀 **Coming Soon** - Extension is currently in review for Chrome Web Store

Once published, you'll be able to install directly from the Chrome Web Store.

### From Source

1. **Clone the repository**
   ```bash
   git clone https://github.com/prosdevlab/auth-header-injector.git
   cd auth-header-injector
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Build the extension**
   ```bash
   pnpm build
   ```

4. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Development Mode

```bash
pnpm dev
```

This starts a watch server that auto-rebuilds on file changes. Reload the extension in Chrome to see updates.

## Usage

### Quick Start

1. **Open the side panel**
   - Click the extension icon in Chrome toolbar
   - Side panel opens on the right

2. **Enable the extension**
   - Toggle "Enable extension" at the top

3. **Add your first rule**
   - Click "Add Rule"
   - Enter a URL pattern (e.g., `*.api.example.com`)
   - Paste your auth token
   - Add an optional label

4. **Browse and verify**
   - Navigate to a page that makes API calls
   - See real-time request counts in the context bar
   - Verify rules are "active" (intercepting requests)

## URL Pattern Best Practices

### Understanding Pattern Matching

The extension uses Chrome's `urlFilter` syntax with wildcard support. Here are common patterns and what they match:

#### ✅ Recommended Patterns

| Pattern | Matches | Example URLs |
|---------|---------|--------------|
| `*example.com` | Base domain + all subdomains | `example.com`<br>`api.example.com`<br>`www.example.com` |
| `*.example.com` | **Only** subdomains | `api.example.com`<br>`www.example.com`<br>❌ `example.com` |
| `api.example.com` | Exact subdomain only | `api.example.com`<br>❌ `example.com`<br>❌ `www.example.com` |
| `*://api.example.com/*` | Explicit URL match | `https://api.example.com/users`<br>`http://api.example.com/auth` |

#### ⚠️ Common Mistakes

```bash
# ❌ Won't match base domain
Pattern: *.github.com
Requests to: github.com/api/...  # Not matched!

# ✅ Matches base domain + subdomains
Pattern: *github.com
Requests to: github.com/api/...  # Matched!
Requests to: api.github.com/...  # Matched!
```

#### 🎯 Real-World Examples

**GitHub**
```
Pattern: *github.com
Matches:
  ✅ https://github.com/api/...
  ✅ https://api.github.com/...
  ✅ https://raw.githubusercontent.com/...
```

**Multi-environment API**
```
Pattern: *.lytics.io
Label: Lytics (All Environments)
Matches:
  ✅ https://api.lytics.io/...
  ✅ https://c.lytics.io/...
  ❌ https://lytics.io (base domain)
```

**Staging Only**
```
Pattern: api.staging.example.com
Label: Staging API
Matches:
  ✅ https://api.staging.example.com/users
  ❌ https://api.example.com (production)
```

### Testing Your Patterns

1. **Add the rule** with your pattern
2. **Open the Service Worker console**:
   - Go to `chrome://extensions`
   - Click "Service Worker" under the extension
3. **Navigate to the target site**
4. **Check for logs**: `[Request Tracker] ✓ Matched pattern: ...`

If you don't see matches, your pattern might be too narrow (e.g., using `*.domain.com` when you need `*domain.com`).

## Architecture

### Tech Stack

- **Manifest V3** - Latest Chrome extension API
- **React 19** - UI framework
- **Shadcn UI** - Component library (Radix UI + Tailwind)
- **SDK Kit** - Plugin architecture for service worker
- **Vite** - Build tool with watch mode
- **TypeScript** - Type safety
- **Vitest** - Unit testing

### Key Components

```
src/
├── background/          # Service worker
│   ├── plugins/        # SDK Kit plugins
│   │   ├── chromeStorage.ts       # Persistent storage
│   │   ├── patternMatcher.ts      # URL pattern matching
│   │   └── requestInterceptor.ts  # Header injection
│   └── utils/
│       └── requestTracking.ts     # Pure functions for tracking
├── panel/              # Side panel UI
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   └── App.tsx         # Main app
└── shared/             # Shared types & utilities
```

### Data Flow

1. **User adds rule** → Saved to `chrome.storage.sync`
2. **Storage change event** → Updates rule cache in service worker
3. **Request interceptor** → Injects `Authorization: Bearer {token}` via `declarativeNetRequest`
4. **Request tracker** → Monitors `webRequest` events, updates stats
5. **Side panel UI** → Reads stats via `chrome.storage.local`, displays real-time

### Performance Optimizations

- ✅ **Rule caching** - Rules stored in memory, ~0ms lookup
- ✅ **Batched writes** - Stats written every 3s, reduces I/O by ~90%
- ✅ **Request debouncing** - Duplicate requests ignored for 1s
- ✅ **Event-driven UI** - Updates via `chrome.storage.onChanged`, no polling

## Security & Privacy

### Data Storage

- **All data is stored locally** on your device using Chrome's sync storage
- **No external servers** - No data is transmitted to any third-party services
- **No analytics or tracking** - We don't collect any usage data
- **Open source** - Full code transparency for security auditing

### Token Security

- Tokens are stored in Chrome's encrypted sync storage
- Never logged or transmitted except to your configured domains
- Visible only when you explicitly choose to show them
- Synced securely across your Chrome instances (if Chrome sync is enabled)

### Permissions Explained

We require these permissions for core functionality:

- `declarativeNetRequest` - Inject authentication headers into matching requests
- `storage` - Store your rules and tokens locally
- `tabs` - Detect current page URL for context-aware UI
- `sidePanel` - Display the extension interface
- `webRequest` - Track request statistics (counts only, no content)
- `host_permissions (<all_urls>)` - Allow header injection on domains you configure

## API & Permissions

### Required Permissions

```json
{
  "permissions": [
    "declarativeNetRequest",  // Inject headers
    "storage",                // Persist rules & stats
    "tabs",                   // Get current tab URL
    "sidePanel",              // Side panel UI
    "webRequest"              // Track requests
  ],
  "host_permissions": [
    "<all_urls>"              // Match any domain
  ]
}
```

### Storage Schema

**Sync Storage** (rules, synced across devices)
```typescript
{
  auth_rules: AuthRule[]
}

interface AuthRule {
  id: string;
  pattern: string;      // URL pattern
  token: string;        // Bearer token
  label?: string;       // Optional label
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}
```

**Local Storage** (stats, device-specific)
```typescript
{
  request_stats: {
    [domain: string]: {
      count: number;
      lastSeen: number;   // timestamp
      ruleIds: string[];
    }
  }
}
```

## Development

### Commands

```bash
# Install dependencies
pnpm install

# Start dev server (watch mode)
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Lint & format
pnpm lint
pnpm format

# Type check
pnpm type-check
```

### Project Scripts

- `dev` - Vite watch mode with auto-rebuild
- `build` - Production build to `dist/`
- `test` - Run Vitest tests
- `lint-staged` - Pre-commit hooks (Biome + TypeScript)

### Adding a New Feature

1. **Update types** in `src/shared/types.ts`
2. **Add business logic** in `src/background/` or hooks
3. **Update UI** in `src/panel/components/`
4. **Write tests** in `tests/` or colocated `.test.ts`
5. **Update README** with usage docs

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# With coverage
pnpm test -- --coverage
```

### Test Structure

```
tests/
├── setup.ts            # Global test setup (Chrome API mocks)
└── src/
    └── background/
        └── plugins/
            ├── chromeStorage.test.ts
            ├── patternMatcher.test.ts
            └── requestInterceptor.test.ts
```

Tests use **Vitest** with mocked Chrome APIs. See `tests/setup.ts` for mock implementations.

## Troubleshooting

### Rules not matching requests

**Problem:** You added a rule but don't see request counts increasing.

**Solutions:**
1. Check your pattern - use `*domain.com` instead of `*.domain.com` if targeting the base domain
2. Ensure the rule is **enabled** (toggle in the rules list)
3. Ensure the **extension is enabled** (toggle at top)
4. Check the Service Worker console for `[Request Tracker]` logs
5. Verify the site makes API calls (some sites use GraphQL or WebSockets)

### Extension not injecting headers

**Problem:** Rules show active but headers aren't being sent.

**Solutions:**
1. Check `chrome://extensions` for errors
2. Ensure pattern uses correct syntax (test with `*://domain.com/*`)
3. Verify token format (should be just the token, NOT `Bearer {token}`)
4. Check Network tab in DevTools → Request headers
5. Some sites block extension-injected headers (rare, but possible)

### Service Worker crashes

**Problem:** Extension stops working after a while.

**Solutions:**
1. Chrome kills idle service workers after ~30s (normal behavior)
2. Extension auto-restarts on next event (opening side panel, new request)
3. Check for errors in Service Worker console
4. Reload extension if persistent issues

## Contributing

Contributions welcome! Please:

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, no logic change)
- `refactor:` - Code refactoring
- `test:` - Adding/updating tests
- `chore:` - Maintenance tasks

## Roadmap

- [ ] Export/import rules as JSON
- [ ] Multiple auth header types (API-Key, Basic Auth, Custom)
- [ ] Rule templates for popular APIs (GitHub, AWS, etc.)
- [ ] Request/response logging
- [ ] Statistics dashboard
- [ ] Cloud sync with encryption

## License

MIT License - see [LICENSE](LICENSE) for details

## Support

- **Issues:** [GitHub Issues](https://github.com/prosdevlab/auth-header-injector/issues)
- **Discussions:** [GitHub Discussions](https://github.com/prosdevlab/auth-header-injector/discussions)
- **Repository:** [github.com/prosdevlab/auth-header-injector](https://github.com/prosdevlab/auth-header-injector)

## Acknowledgments

- [SDK Kit](https://github.com/lytics/sdk-kit) - Plugin architecture for Chrome extensions
- [Shadcn UI](https://ui.shadcn.com/) - Component library
- [Lucide Icons](https://lucide.dev/) - Icon set
- [Chrome Extensions Docs](https://developer.chrome.com/docs/extensions/) - API reference

---

**Built with ❤️ for developers who live in the browser**

**Free & Open Source** • MIT License • [ProsDevLab](https://github.com/prosdevlab)

