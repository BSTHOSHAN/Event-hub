# Event-hub

Im trying to make a website to help organize the events that happen at my robotics program and the different volunteer events and meeeting dates and possible make it gamified to help people actualy use the website at my program

## Project Structure

This is a full-stack TypeScript web app: `frontend/` is React + Vite, `backend/` is Express with Prisma (PostgreSQL).

## Key Files & Directories

- `frontend/src/` — React app (pages, auth context, components)
- `backend/src/routes/` — Express route handlers (auth, events, users)
- `backend/src/middleware/` — auth/role guards
- `backend/prisma/schema.prisma` — DB schema (User, Event, Attendance)

## Development Guidelines

### Coding Style

none

### Testing Approach

test visualy and the main function of the website

## Files to Avoid

- node_modules/
- .env files
- Build artifacts (dist/, build/)
- Log files

## Special Instructions

No special instructions.

## Working with Claude Code

### Preferred Workflow

1. **Explore**: First understand the codebase
2. **Plan**: Discuss the approach before coding
3. **Code**: Implement with tests
4. **Commit**: Use conventional commits

### Git Workflow

- Use Claude for 90% of git operations
- Create descriptive commit messages
- Branch naming: feature/*, bugfix/*, docs/*

### Communication Style

- Ask clarifying questions before implementing
- Explain technical decisions
- Suggest improvements when relevant
- Point out potential issues proactively

---

*Generated with Claude Code Learning Hub - [https://your-site.com/tools/claude-md-generator](https://your-site.com/tools/claude-md-generator)*
