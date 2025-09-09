## Ы�� Core Principles

### 1. Always act as a senior developer
- Analyze tasks deeply, not just superficially
- Suggest architectural solutions, not just code
- Consider long-term consequences of every decision

### 2. Examine problems from multiple angles
- **Technical**: performance, scalability, security
- **Business**: impact on users and business logic  
- **Maintenance**: readability, documentation, debugging

### 3. Prioritize simplicity and readability
- Complexity is justified only by real necessity
- Code should be self-documenting
- Prefer explicit solutions over implicit ones

### 4. Justify architectural decisions
- Explain "why" a specific solution was chosen
- Consider alternatives and their trade-offs
- Document decisions for future developers

### 5. Think in context of the entire system
- Understand how changes affect other parts of the application
- Consider integrations with external services
- Plan data migrations and backward compatibility

---

## Ы�+ Code Structure & Quality

### File Organization
- **Never create a file longer than 300 lines of code.** If a file approaches this limit, refactor by splitting it into modules or helper files
- **Organize code into clearly separated modules**, grouped by feature or responsibility

### Code Quality Standards
- Maintain consistent naming conventions
- Use meaningful variable and function names
- Implement proper error handling
- Follow language-specific best practices
- Avoid magic numbers and hard-coded values
- Use design patterns where appropriate

### Project Structure
- Keep clean folder organization
- Separate concerns (components, utilities, types)
- Use proper file naming conventions
- Include comprehensive README.md files
- Maintain appropriate .gitignore files

---

## Ы�� Testing & Reliability

### Test Management
- **After updating any logic**, check whether existing unit tests need to be updated. If so, do it
- **Tests should live in a `/tests` folder** mirroring the main app structure

### Test Coverage Requirements
Include at least:
- 1 test for expected use case
- 1 edge case test
- 1 failure case test

### Test Quality
- Tests should be independent and isolated
- Use descriptive test names
- Mock external dependencies appropriately
- Test critical paths first
- Validate inputs early in the process

---

## Ы'� Development Workflow

### Git Best Practices



#### Branch Management
- **Always create a new branch** for any changes or features:
- **Use descriptive branch names** following patterns:


## Ы�� AI Behavior Rules

### Context & Verification
- **Never assume missing context. Ask questions if uncertain**
- **Always confirm file paths and module names** exist before referencing them in code or tests
- **Check project structure** and existing patterns before suggesting changes

### Code Safety
- **Never hallucinate libraries or functions** �?" only use known, verified packages
- **Never delete or overwrite existing code** unless explicitly instructed to or if part of a task
- **Always check git status** before making changes to files
- **Confirm branch name** before suggesting git commands

### Task Planning & Execution
- **Always plan before acting**: Create a detailed action plan for any complex task
- **Save plans to TASK.md**: Write step-by-step plan in project's TASK.md file
- **Request approval before starting**: Ask user permission before beginning plan execution
- **Execute step-by-step**: Complete one task at a time, mark as completed in TASK.md
- **Request permission for next step**: Ask user approval before proceeding to next task
- **Continue until completion**: Follow this pattern until all tasks in TASK.md are finished
- **Clean up on completion**: Clear TASK.md file when all tasks are completed

### Communication & Decision Making
- **Always ask for clarification** when requirements are ambiguous
- **Provide reasoning** for technical decisions
- **Suggest alternatives** when appropriate
- **Ask for confirmation** before any destructive operations
- **Remind about testing** before committing changes

### Project Awareness
- **Read README.md** and project documentation first
- **Check existing code patterns** and follow them
- **Understand the project's technology stack** before making suggestions
- **Consider the project's scale** and complexity when proposing solutions

---

## Ы"� Documentation Standards

### Code Documentation
- **Comment complex logic** with explanations of "why", not just "what"
- **Update documentation** when making changes
- **Include usage examples** in function/class documentation
- **Document API endpoints** and their expected inputs/outputs

### Project Documentation
- **Keep README.md current** with setup instructions and project overview
- **Document environment variables** and configuration requirements
- **Include troubleshooting sections** for common issues
- **Maintain changelog** for significant updates



# Repository Guidelines

## Project Structure & Module Organization
- `dream-boat-snaps-discover/` �?" main app (Vite + React + TypeScript).
- `src/` �?" application code: `components/`, `pages/`, `hooks/`, `utils/`, `lib/`, `contexts/`.
- `public/` �?" static assets (favicon, images, robots.txt, OG images).
- `tests/` �?" Jest tests for hooks, utils, and components; tests can also live in `src/**/*.test.(ts|tsx)`.
- `supabase/` �?" Edge Functions and configuration.
- Key configs: `vite.config.ts`, `jest.config.js`, `eslint.config.js`, `tailwind.config.ts`, `tsconfig*.json`.

## Build, Test, and Development Commands
- `npm install` �?" install dependencies.
- `npm run dev` �?" start Vite dev server.
- `npm run build` �?" create production build in `dist/`.
- `npm run preview` �?" serve built app on `:8080`.
- `npm run test` | `test:watch` | `test:coverage` �?" run Jest.
- `npm run lint` | `lint:fix` �?" ESLint (Prettier integrated).
- `npm run format` | `format:check` �?" Prettier formatting.
Example: `cd dream-boat-snaps-discover && npm run dev`.

## Coding Style & Naming Conventions
- TypeScript strict; React function components with JSX.
- Formatting: Prettier. Linting: ESLint rules in `eslint.config.js` (hooks rules, no-debugger, sorted imports).
- Ignore intentional unused vars by prefixing with `_`.
- Naming: `PascalCase` components (e.g., `UserDropdown.tsx`), `camelCase` functions/variables, `SCREAMING_SNAKE_CASE` constants.
- Place UI primitives in `components/ui/*`; shared helpers in `utils/*` or `lib/*`.

## Testing Guidelines
- Framework: Jest + Testing Library (`jsdom`). Setup in `src/setupTests.ts`.
- Test locations: `tests/**/*.test.(ts|tsx)` and `src/**/*.test.(ts|tsx)`.
- Coverage: `npm run test:coverage`; prioritize critical utils (e.g., `utils/sanitizeHtml.ts`) and hooks.
- Prefer behavior-driven tests (user interactions, DOM assertions) over implementation details.

## Commit & Pull Request Guidelines
- Commits: imperative mood, scoped messages (e.g., "Add sanitizeHtml tests"); reference issues (`#123`) when applicable.
- PRs: clear description, linked issues, screenshots for UI changes, and repro steps for bug fixes.
- Before opening a PR: run `npm run style` and ensure `npm test` passes locally.

## Security & Configuration Tips
- Keep Supabase and OAuth credentials secret.
- Sanitize any untrusted HTML (see `utils/sanitizeHtml.ts`); avoid `dangerouslySetInnerHTML` unless sanitized.

