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
- [ ] Wraps `chrome.storage.sync` API
- [ ] Type-safe get/set/remove/clear methods
- [ ] Emits events (storage:get, storage:set, etc.)
- [ ] Error handling with fallbacks
- [ ] JSDoc documentation

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
- [ ] URL pattern matching (substring)
- [ ] Wildcard support (*.domain.com)
- [ ] Pattern validation
- [ ] Emits events (matcher:matched, matcher:no-match)
- [ ] JSDoc documentation

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
- [ ] Wraps `chrome.declarativeNetRequest` API
- [ ] enable/disable/updateRules methods
- [ ] Reads rules from storage plugin
- [ ] Creates dynamic rules from auth rules
- [ ] Handles 300 rule limit
- [ ] Emits events (interceptor:enabled, etc.)
- [ ] Auto-updates on storage changes
- [ ] JSDoc documentation

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
- [ ] SDK instance creation
- [ ] Plugin registration (storage, matcher, interceptor)
- [ ] SDK initialization
- [ ] Enable interceptor on startup
- [ ] Message listener for UI communication
- [ ] Shared types exported

---

## Phase 3: User Interface

### Task #5: Options Page [P]

**GitHub Issue:** #5  
**Depends on:** Task #4  
**Blocks:** None  
**Estimate:** 3 hours  
**Can run in parallel:** Yes (with #6)

#### Files to Create
- `src/options/index.html`
- `src/options/App.tsx` (main component)
- `src/options/components/RuleList.tsx`
- `src/options/components/RuleForm.tsx`
- `src/options/components/ui/` (Shadcn components: Button, Switch, Input, Card, Dialog)
- `src/options/hooks/useAuthRules.ts`
- `src/options/hooks/useExtensionEnabled.ts`
- `src/shared/lib/utils.ts` (cn helper)

#### Acceptance Criteria
- [ ] Install Shadcn UI components (npx shadcn@latest init)
- [ ] List all auth rules (RuleList component)
- [ ] Add new rule form (RuleForm component)
- [ ] Edit existing rule (Dialog component)
- [ ] Delete rule with confirmation (Dialog component)
- [ ] Toggle rule enabled/disabled (Switch component)
- [ ] Global enable/disable toggle (Switch component)
- [ ] Show/hide token (Input type="password" with toggle)
- [ ] Real-time validation
- [ ] Custom hooks for state (useAuthRules, useExtensionEnabled)
- [ ] Message passing to background worker
- [ ] Responsive design (Tailwind CSS)
- [ ] Save confirmation feedback
- [ ] Accessible (Radix UI ARIA compliant)

---

### Task #6: Popup UI [P]

**GitHub Issue:** #6  
**Depends on:** Task #4  
**Blocks:** None  
**Estimate:** 1 hour  
**Can run in parallel:** Yes (with #5)

#### Files to Create
- `src/popup/index.html`
- `src/popup/App.tsx` (main component)
- `src/popup/components/StatusBadge.tsx`

#### Acceptance Criteria
- [ ] Show extension status (enabled/disabled with Badge)
- [ ] Quick toggle button (Switch component)
- [ ] Show active rule count
- [ ] Link to options page (Button component)
- [ ] Minimal, clean design (Tailwind CSS)
- [ ] Responsive to state changes (useState + useEffect)
- [ ] Message passing to background worker

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
- [ ] Create extension icon (simple, recognizable)
- [ ] 3 sizes for Chrome requirements
- [ ] Professional appearance

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
- [ ] Project description
- [ ] Features list
- [ ] Installation instructions (Chrome Web Store + dev mode)
- [ ] Usage guide with screenshots
- [ ] Development setup
- [ ] Build instructions
- [ ] SDK Kit attribution
- [ ] License (MIT)
- [ ] Contributing guidelines (basic)

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
**Depends on:** Task #4, #5, #6  
**Blocks:** None  
**Estimate:** 2 hours  
**Can run in parallel:** No

#### Test Cases
- [ ] Install extension in Chrome (dev mode)
- [ ] Add first rule (empty state)
- [ ] Add multiple rules
- [ ] Edit existing rule
- [ ] Delete rule
- [ ] Toggle rule on/off
- [ ] Toggle extension on/off
- [ ] Test header injection (DevTools Network tab)
- [ ] Test pattern matching (various URLs)
- [ ] Test storage persistence (reload extension)
- [ ] Test sync (if multiple Chrome instances available)
- [ ] Test 300 rule limit behavior
- [ ] Test error states (invalid patterns, etc.)

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
- [ ] Task #1: Chrome Storage Plugin [P] → Issue #1
- [ ] Task #2: Pattern Matcher Plugin [P] → Issue #2
- [ ] Task #3: Request Interceptor Plugin → Issue #3

**Phase 2: Background Service Worker**
- [ ] Task #4: Background Script → Issue #4

**Phase 3: User Interface**
- [ ] Task #5: Options Page [P] → Issue #5
- [ ] Task #6: Popup UI [P] → Issue #6

**Phase 4: Assets & Documentation**
- [ ] Task #7: Extension Assets [P] → Issue #7
- [ ] Task #8: README [P] → Issue #8
- [ ] Task #9: Development Workflow [P] → Issue #9

**Phase 5: Testing & Polish**
- [ ] Task #10: Manual Testing → Issue #10
- [ ] Task #11: Link to SDK Kit → Issue #11

**Progress:** Initial commit done, 0/11 tasks complete (0%)

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
              ├─→ Task #5 (Options) [P] → Issue #5
              ├─→ Task #6 (Popup) [P] → Issue #6
              └─→ Task #10 (Testing) → Issue #10

Task #7 (Assets) [P] → Issue #7 - Can start anytime
```

---

## Notes

- **Parallel Tasks:** #2 and #3 can be done together, #6 and #7 can be done together
- **Critical Path:** Task #1 → #2,#3 → #4 → #5 → #6,#7 → #11
- **Optional:** Unit tests for plugins (add if time permits)
- **SDK Kit Link:** Do early to test integration as you build

---

## Timeline Estimate

**With parallel execution:**
- **Day 1:** Tasks #1-4 (plugins + background)
- **Day 2:** Tasks #5-9 (UI + docs)
- **Day 3:** Tasks #10-11 (testing + polish)

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

