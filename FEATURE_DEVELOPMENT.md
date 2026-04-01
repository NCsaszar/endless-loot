# Feature Development Workflow

This is the mandatory workflow for implementing any new feature or improving an existing one in Endless Loot. **Do not skip steps. Do not write code until Step 5.**

---

## Step 1 — Research

Before anything else, research how this type of feature works in similar games and contexts.

1. **Web search** for the feature in similar game genres (idle RPGs, ARPGs, looter games, roguelikes, Diablo-likes, incremental games, etc.)
2. Look for:
   - Common implementations and variations
   - Game design best practices and known pitfalls
   - Creative approaches or twists that fit a semi-idle RPG
   - UX patterns that make the feature feel good to interact with
3. **Summarize findings** briefly for the user — what other games do, what works, what to avoid

---

## Step 2 — Visual Context (UI/UX features)

If the feature involves any UI or visual changes:

1. **Start the dev server** (`npm run dev` from `endless-loot/`)
2. Use **Playwright MCP** to navigate to the relevant screen and take screenshots
3. Use these screenshots as reference context for understanding the current state
4. Research UI/UX patterns from similar games for inspiration
5. Use the **frontend-design** skill when building or polishing UI components

This ensures design decisions are grounded in the actual current state, not assumptions.

---

## Step 3 — Question Chain

Generate a detailed, numbered chain of questions to fully scope the feature before planning.

**Rules for questions:**
- Each question should address a specific design decision, scope boundary, or implementation detail
- Provide **suggested defaults or example answers** where possible (e.g., `(default: 3 tiers)`, `(e.g., "percentage-based" or "flat reduction")`)
- Group related questions under clear sub-headings if the feature is complex
- Questions should progress from high-level design down to specific details
- **Always end the list with:**
  > **0. Anything else you'd like to add, change, or clarify? (free-form)**

**Present all questions in a single prompt** and wait for user responses. Do not proceed until all questions are answered. If answers raise new questions, ask follow-ups before moving on.

---

## Step 4 — Plan Draft + Review

Write a detailed implementation plan incorporating research findings + user answers.

**Plan must follow these principles:**

### Game Development Best Practices
- **Data-driven:** Stats, formulas, thresholds, and tuning values go in data files, not hardcoded in logic
- **System separation:** Game logic in `src/systems/`, UI in `src/components/`, types in `src/types.ts`
- **Modular design:** Each system should be independently testable and modifiable
- **Iterability:** Design for easy tuning — values that will need balancing should be easy to find and change
- **State consistency:** All feature state integrates cleanly into the single `GameState` object

### Coding Best Practices
- **TypeScript strict:** Full type safety, no `any` escape hatches
- **Single responsibility:** Functions and components do one thing well
- **Consistent patterns:** Follow existing codebase conventions (see `src/` for examples)
- **Minimal coupling:** New systems should not require changes to unrelated systems
- **Performance aware:** Avoid unnecessary re-renders, expensive calculations in the game loop, or DOM thrashing

### Plan Structure
1. **Overview** — What this feature does and why
2. **Files to create/modify** — Specific paths
3. **Type changes** — New types or extensions to existing types in `types.ts`
4. **Data definitions** — New data files or additions to existing data
5. **System logic** — New functions or modifications to game systems
6. **UI components** — New or modified components
7. **State integration** — How it connects to `GameState` and save/load
8. **Edge cases** — What happens in boundary conditions

**After presenting the plan, explicitly ask:**
> Would you like to **add to, change, or remove** anything from this plan before I begin implementation?

**Wait for explicit user approval.** If the user adds to the plan, incorporate changes and re-confirm before proceeding.

---

## Step 5 — Execute

Only after explicit user approval of the final plan:

1. Implement following the approved plan
2. Keep code modular and iterable
3. Use **simplify** skill after writing significant code to review quality
4. Use **Playwright MCP** to visually verify UI changes with screenshots
5. Run `npm run build` to verify no TypeScript errors
6. **Commit and push** after completion per git workflow

---

## Quick Reference

| Step | Action | Gate |
|------|--------|------|
| 1 | Web research on feature in similar games | Summarize findings |
| 2 | Screenshot current UI state (if UI feature) | Visual context captured |
| 3 | Present scoped question chain with defaults | All questions answered |
| 4 | Write plan, ask for additions/changes | Explicit user approval |
| 5 | Implement, verify, commit, push | Build passes, visually verified |
