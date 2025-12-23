# Task Breakdown - Auth Header Injector

**Project:** Auth Header Injector MVP  
**Total Estimated Time:** 2-3 days  
**Last Updated:** December 19, 2025

---

## Workflow

Following the **spec-driven workflow** from SDK Kit:
1. **Specs** define what to build (this file + `spec.md`)
2. **GitHub issues** track progress (one issue per task)
3. **Implementation** follows specs with feature branches
4. **PRs** for review and merge

---

## Task Metadata

- **Depends on:** Must complete before starting this task
- **Blocks:** Other tasks waiting for this to complete
- **Estimate:** Time estimate for completion
- **Can run in parallel:** Tasks marked `[P]` can be done simultaneously

---

## Initial Commit ✅ COMPLETE

Project scaffolding and specifications:
- [x] package.json with dependencies (SDK Kit, React 19, Shadcn UI, Tailwind)
- [x] tsconfig.json (strict mode)
- [x] vite.config.ts (web extension plugin + React)
- [x] biome.json (linting/formatting)
- [x] .gitignore
- [x] manifest.json (Chrome Manifest V3)
- [x] specs/spec.md (full specification)
- [x] specs/tasks.md (this file)

**Not creating GitHub issue for this - just initial commit.**

---

## Phase 1: Chrome SDK Kit Plugins

### Task #1: Chrome Storage Plugin

**GitHub Issue:** #1  
**Depends on:** Initial commit  
**Blocks:** Task #3, #4, #5  
**Estimate:** 1 hour  
**Can run in parallel:** Yes (with #2)

#### Files to Create
- `src/background/plugins/chromeStorage.ts`
- `src/background/plugins/chromeStorage.test.ts` (optional)

#### Acceptance Criteria
- [x] Wraps `chrome.storage.sync` API
- [x] Type-safe get/set/remove/clear methods
- [x] Emits events (storage:get, storage:set, etc.)
- [x] Error handling with fallbacks
- [x] JSDoc documentation

---

### Task #2: Pattern Matcher Plugin [P]

**GitHub Issue:** #2  
**Depends on:** Initial commit  
**Blocks:** Task #3  
**Estimate:** 1 hour  
**Can run in parallel:** Yes (with #1)

#### Files to Create
- `src/background/plugins/patternMatcher.ts`
- `src/background/plugins/patternMatcher.test.ts` (optional)

#### Acceptance Criteria
- [x] URL pattern matching (substring)
- [x] Wildcard support (*.domain.com)
- [x] Pattern validation
- [x] Emits events (matcher:matched, matcher:no-match)
- [x] JSDoc documentation

---

### Task #3: Request Interceptor Plugin

**GitHub Issue:** #3  
**Depends on:** Task #1, #2  
**Blocks:** Task #4  
**Estimate:** 2 hours  
**Can run in parallel:** No

#### Files to Create
- `src/background/plugins/requestInterceptor.ts`

#### Acceptance Criteria
- [x] Wraps `chrome.declarativeNetRequest` API
- [x] enable/disable/updateRules methods
- [x] Reads rules from storage plugin
- [x] Creates dynamic rules from auth rules
- [x] Handles 300 rule limit
- [x] Emits events (interceptor:enabled, etc.)
- [x] Auto-updates on storage changes
- [x] JSDoc documentation

---

## Phase 2: Background Service Worker

### Task #4: Background Script

**GitHub Issue:** #4  
**Depends on:** Task #1, #2, #3  
**Blocks:** Task #5, #6  
**Estimate:** 1 hour  
**Can run in parallel:** No

#### Files to Create
- `src/background/index.ts`
- `src/shared/types.ts`

#### Acceptance Criteria
- [x] SDK instance creation
- [x] Plugin registration (storage, matcher, interceptor)
- [x] SDK initialization
- [x] Enable interceptor on startup
- [x] Message listener for UI communication
- [x] Shared types exported

---

## Phase 3: User Interface

### Task #5: Side Panel UI

**GitHub Issue:** #5  
**Depends on:** Task #4  
**Blocks:** Task #10  
**Estimate:** 3 hours  
**Can run in parallel:** No

**Note:** Architecture updated to use unified Side Panel interface instead of separate Options Page + Popup. Side panel provides persistent, context-aware interface that stays open while browsing.

#### Files to Create
- `src/panel/index.html`
- `src/panel/App.tsx` (main component)
- `src/panel/components/ContextBar.tsx` (current page context)
- `src/panel/components/RulesList.tsx` (all rules management)
- `src/panel/components/RuleCard.tsx` (individual rule display)
- `src/panel/components/RuleForm.tsx` (inline rule editing)
- `src/panel/components/SettingsDialog.tsx` (delete confirmation)
- `src/panel/components/ui/` (Shadcn components: Button, Switch, Input, Card, Dialog, Label, Form)
- `src/panel/hooks/useAuthRules.ts`
- `src/panel/hooks/useExtensionEnabled.ts`
- `src/panel/hooks/useCurrentTab.ts`
- `src/panel/hooks/useMatchedRules.ts`
- `src/shared/lib/utils.ts` (cn helper)

#### Acceptance Criteria
- [x] Install Shadcn UI components (npx shadcn@latest init)
- [x] Side panel opens when extension icon is clicked
- [x] Manifest configured with `side_panel.default_path`
- [x] Header section with extension name and global enable/disable toggle
- [x] Current Page Context section (shows current tab URL/hostname)
- [x] Active Rules section (shows ONLY rules matching current page)
- [x] All Rules section (complete list with inline editing)
- [x] Add new rule form (inline)
- [x] Edit existing rule (inline editing)
- [x] Delete rule with confirmation (Dialog component)
- [x] Toggle rule enabled/disabled (Switch component)
- [x] Global enable/disable toggle (Switch component)
- [x] Show/hide token (with toggle)
- [x] Copy token to clipboard button
- [x] Quick "Add rule for [domain]" button in context section
- [x] Real-time validation
- [x] Custom hooks for state (useAuthRules, useExtensionEnabled, useCurrentTab, useMatchedRules)
- [x] Message passing to background worker
- [x] Context-aware updates as user navigates
- [x] Responsive design (Tailwind CSS)
- [x] Accessible (Radix UI ARIA compliant)

---

### Task #6: ~~Popup UI~~ [OBSOLETE]

**Status:** ❌ Obsolete - Replaced by Side Panel UI (Task #5)

**Reason:** Architecture updated to use unified Side Panel interface. Side panel provides all functionality (status, management, context-aware display) in one persistent interface, eliminating need for separate popup.

---

## Phase 4: Assets & Documentation

### Task #7: Extension Assets [P]

**GitHub Issue:** #7  
**Depends on:** None  
**Blocks:** None  
**Estimate:** 30 minutes  
**Can run in parallel:** Yes (with #8, #9)

#### Files to Create
- `public/icons/icon-16.png`
- `public/icons/icon-48.png`
- `public/icons/icon-128.png`

#### Acceptance Criteria
- [x] Create extension icon (simple, recognizable)
- [x] 3 sizes for Chrome requirements
- [x] Professional appearance

---

### Task #8: README [P]

**GitHub Issue:** #8  
**Depends on:** Initial commit  
**Blocks:** None  
**Estimate:** 1 hour  
**Can run in parallel:** Yes (with #7, #9)

#### Files to Create
- `README.md`

#### Acceptance Criteria
- [x] Project description
- [x] Features list
- [x] Installation instructions (Chrome Web Store + dev mode)
- [x] Usage guide with screenshots
- [x] Development setup
- [x] Build instructions
- [x] SDK Kit attribution
- [x] License (MIT)
- [x] Contributing guidelines (basic)

---

### Task #9: Development Workflow [P]

**GitHub Issue:** #9  
**Depends on:** None  
**Blocks:** None  
**Estimate:** 30 minutes  
**Can run in parallel:** Yes (with #7, #8)

#### Files to Create
- `CONTRIBUTING.md` (optional)
- `.vscode/extensions.json` (recommended extensions)
- `.vscode/settings.json` (workspace settings)

#### Acceptance Criteria
- [ ] VSCode recommended extensions (Biome, TypeScript)
- [ ] VSCode settings for auto-format
- [ ] Clear development instructions

---

## Phase 5: Testing & Polish

### Task #10: Manual Testing

**GitHub Issue:** #10  
**Depends on:** Task #4, #5  
**Blocks:** None  
**Estimate:** 2 hours  
**Can run in parallel:** No

#### Test Cases

**Side Panel UI:**
- [ ] Side panel opens when extension icon is clicked
- [ ] Side panel stays open while browsing
- [ ] Side panel updates context as user navigates between tabs
- [ ] Side panel can be collapsed/expanded (Chrome built-in)
- [ ] Side panel can be resized (Chrome built-in)

**Rule Management:**
- [ ] Install extension in Chrome (dev mode)
- [ ] Add first rule (empty state)
- [ ] Add multiple rules
- [ ] Edit existing rule (inline editing)
- [ ] Delete rule (with confirmation dialog)
- [ ] Toggle rule on/off
- [ ] Toggle extension on/off (global toggle)
- [ ] Show/hide token
- [ ] Copy token to clipboard

**Context-Aware Features:**
- [ ] Current Page Context section shows correct URL/hostname
- [ ] Active Rules section shows only matching rules for current page
- [ ] Rules update when navigating to different domains
- [ ] Quick "Add rule for [domain]" button works
- [ ] Visual indicator (green/gray dot) shows rule status

**Header Injection:**
- [ ] Test header injection (DevTools Network tab)
- [ ] Test pattern matching (various URLs)
- [ ] Verify Authorization header format: `Bearer {token}`
- [ ] Test with multiple matching rules
- [ ] Test with disabled rules (should not inject)

**Storage & Persistence:**
- [ ] Test storage persistence (reload extension)
- [ ] Test sync (if multiple Chrome instances available)
- [ ] Test 300 rule limit behavior

**Error States:**
- [ ] Invalid pattern validation
- [ ] Empty token validation
- [ ] Duplicate pattern warning
- [ ] Storage full error handling

**Accessibility:**
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility (ARIA labels)
- [ ] Focus management

---

### Task #11: Link to SDK Kit

**GitHub Issue:** #11  
**Depends on:** Initial commit, SDK Kit built  
**Blocks:** None  
**Estimate:** 15 minutes  
**Can run in parallel:** No

#### Steps
- [ ] Build SDK Kit (`pnpm build` in sdk-kit repo)
- [ ] Link SDK Kit packages (`pnpm link --global @lytics/sdk-kit`)
- [ ] Link in this project (`pnpm link --global @lytics/sdk-kit`)
- [ ] Verify build works
- [ ] Test hot reload (change SDK Kit, rebuild, extension updates)

---

## Progress Tracking

**Initial Commit**
- [x] Project scaffolding & specs ✅ COMPLETE

**Phase 1: Chrome SDK Kit Plugins**
- [x] Task #1: Chrome Storage Plugin [P] → Issue #1 (complete)
- [x] Task #2: Pattern Matcher Plugin [P] → Issue #2 (complete)
- [x] Task #3: Request Interceptor Plugin → Issue #3 (complete)

**Phase 2: Background Service Worker**
- [x] Task #4: Background Script → Issue #4 (complete)

**Phase 3: User Interface**
- [x] Task #5: Side Panel UI → Issue #5 (complete)
- [x] Task #6: Popup UI [OBSOLETE] → Issue #6 (closed)

**Phase 4: Assets & Documentation**
- [x] Task #7: Extension Assets [P] → Issue #7 (complete)
- [x] Task #8: README [P] → Issue #8 (complete)
- [ ] Task #9: Development Workflow [P] → Issue #9

**Phase 5: Testing & Polish**
- [ ] Task #10: Manual Testing → Issue #10
- [x] Task #11: Link to SDK Kit → Issue #11 (complete)

**Progress:** Initial commit done, 8/10 active tasks complete (80%)
- Tasks #1-4: Plugins + Background (complete)
- Task #5: Side Panel UI (complete)
- Task #7: Extension Assets (complete)
- Task #8: README (complete)
- Task #11: Link SDK Kit (complete)
- Task #6: Popup UI (obsolete, replaced by Side Panel)
- Remaining: Task #9 (Development Workflow), Task #10 (Manual Testing)

---

## Dependency Graph

```
Initial Commit ✅
  ├─→ Task #1 (Storage Plugin) [P] → Issue #1
  ├─→ Task #2 (Pattern Matcher) [P] → Issue #2
  ├─→ Task #8, #9 (Docs) [P] → Issues #8, #9
  └─→ Task #11 (Link SDK Kit) → Issue #11

Task #1 + #2
  └─→ Task #3 (Interceptor) → Issue #3
        └─→ Task #4 (Background) → Issue #4
              └─→ Task #5 (Side Panel) → Issue #5
                    └─→ Task #10 (Testing) → Issue #10

Task #6 (Popup) → Issue #6 - OBSOLETE (closed, replaced by Side Panel)

Task #7 (Assets) [P] → Issue #7 - Can start anytime
```

---

## Notes

- **Parallel Tasks:** #2 and #3 can be done together, #7, #8, #9 can be done together
- **Critical Path:** Task #1 → #2,#3 → #4 → #5 → #10 → #11
- **Architecture Update:** Task #6 (Popup) is obsolete - replaced by unified Side Panel UI (Task #5)
- **Optional:** Unit tests for plugins (add if time permits)
- **SDK Kit Link:** Do early to test integration as you build

---

## Timeline Estimate

**With parallel execution:**
- **Day 1:** Tasks #1-4 (plugins + background)
- **Day 2:** Tasks #5, #7-9 (Side Panel UI + docs/assets)
- **Day 3:** Tasks #10-11 (testing + polish)

**Note:** Task #6 (Popup) removed - replaced by unified Side Panel UI (Task #5)

**Sequential (solo):**
- Add 1 day for sequential execution

---

## GitHub Issue Creation

After initial commit, create issues from tasks:

```bash
# Use gh CLI to create issues
gh issue create --title "Implement Chrome Storage Plugin" --body "See specs/tasks.md Task #1" --label "type: feature"
gh issue create --title "Implement Pattern Matcher Plugin" --body "See specs/tasks.md Task #2" --label "type: feature"
# ... etc
```

Or create manually on GitHub with task details from this file.

