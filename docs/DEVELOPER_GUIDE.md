# Developer Guide

Complete guide for developers working on the Pattern Compliance Dashboard.

## Quick Start (5 minutes)

### Prerequisites
- Node.js 20+
- Git
- Cloudflare account (for deployment)

### Setup

```bash
# 1. Clone repository
git clone https://github.com/RestivTech/pattern-compliance-dashboard.git
cd pattern-compliance-dashboard

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Create environment file
cp .env.example .env.local

# 4. Start development server
npm run dev

# 5. Open browser
open http://localhost:3000
```

## Project Structure

```
project/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes
│   │   ├── monitoring/         # Monitoring page
│   │   └── layout.tsx          # Root layout
│   ├── components/             # React components
│   │   ├── error-boundary.tsx  # Error boundary
│   │   └── monitoring-dashboard.tsx
│   ├── lib/                    # Utilities
│   │   ├── logger.ts           # Logging
│   │   ├── env.ts              # Configuration
│   │   ├── api-error-handler.ts
│   │   ├── validation.ts       # Input validation
│   │   └── cloudflare.ts       # CF Workers utils
│   └── env/                    # Environment configs
├── scripts/
│   └── db-migrate.ts           # Migration tool
├── migrations/                 # Database migrations
├── tests/
│   ├── e2e/                    # End-to-end tests
│   └── unit/                   # Unit tests
├── docs/                       # Documentation
├── .github/workflows/          # CI/CD pipelines
├── playwright.config.ts        # E2E test config
├── wrangler.toml              # Workers config
├── next.config.ts             # Next.js config
└── package.json               # Dependencies
```

## Development Workflow

### 1. Create Feature Branch

```bash
# Create branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

**Branch Naming Convention**:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `chore/` - Build, CI, deps
- `refactor/` - Code improvements

### 2. Make Changes

**Guidelines**:
- Follow TypeScript strict mode
- Keep components small and focused
- Use proper error handling
- Add JSDoc comments for public APIs
- Test-driven development (write tests first)

### 3. Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run E2E tests
npm run test:e2e

# Run specific test file
npm run test -- src/lib/validation.test.ts

# Generate coverage report
npm run test -- --coverage
```

### 4. Commit Changes

```bash
# Stage files
git add src/lib/my-feature.ts

# Commit with conventional message
git commit -m "feat(lib): add new validation logic"

# Or use interactive mode
git commit  # Opens editor for detailed message
```

**Commit Message Format**:
```
type(scope): subject

body (optional)
footer (optional)
```

**Types**:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style (formatting, missing semicolons)
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `test` - Test additions
- `chore` - Build, CI, dependencies

### 5. Push & Create Pull Request

```bash
# Push feature branch
git push origin feature/your-feature-name

# Create PR (auto-opens browser)
gh pr create --title "Add feature X" --body "Description"
```

### 6. Code Review & CI

- GitHub Actions runs automated tests
- At least 1 approval required before merge
- All tests must pass
- No merge conflicts

### 7. Merge to Develop/Main

```bash
# Local merge (if manual)
git checkout develop
git merge feature/your-feature-name
git push origin develop

# Or via GitHub PR interface
# Click "Merge pull request"
```

## Development Commands

### Building

```bash
# Development build
npm run build

# Production build
npm run build:prod

# Analyze bundle size
npm run build:analyze
```

### Testing

```bash
# Run all tests
npm run test

# Run tests matching pattern
npm run test -- patterns.test.ts

# Run with coverage
npm run test -- --coverage

# E2E tests
npm run test:e2e

# E2E with UI
npm run test:e2e:headed

# Debug E2E
npm run test:e2e:debug

# Smoke tests (quick validation)
npm run test:smoke

# Security audit
npm run security-audit

# Performance tests
npm run test:perf
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code (Prettier)
npm run format

# Type check
npm run type-check
```

### Database

```bash
# Create migration
npm run migrate:create -- migration_name

# Apply migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Check migration status
npm run migrate:status
```

### Deployment

```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod

# Dry run (preview)
wrangler deploy --dry-run
```

## Code Style & Standards

### TypeScript

**Strict Mode Enabled**: All `tsconfig.json` settings are strict

```typescript
// ✓ Good - explicit types
function add(a: number, b: number): number {
  return a + b
}

// ✗ Bad - implicit any
function add(a, b) {
  return a + b
}
```

### React Components

**Functional Components with Hooks**:

```typescript
interface Props {
  title: string
  count?: number
}

export function MyComponent({ title, count = 0 }: Props) {
  const [state, setState] = useState(0)

  return <div>{title}</div>
}
```

### Error Handling

**Always use proper error handling**:

```typescript
// ✓ Good
try {
  await fetch(url)
} catch (error) {
  log.error('Fetch failed', error)
  throw new ValidationError('Network error')
}

// ✗ Bad
const data = await fetch(url)  // No error handling
```

### Logging

**Use structured logging**:

```typescript
import { log } from '@/lib/logger'

log.info('User action', { userId: '123', action: 'login' })
log.error('Database error', error, { query: 'SELECT ...' })
```

### Validation

**Always validate input**:

```typescript
import { validateInput, stringValidator } from '@/lib/validation'

const result = validateInput(input, {
  validate: (data) => stringValidator.validate(data)
})
```

## Common Tasks

### Adding a New API Endpoint

1. **Create route file**:
```typescript
// src/app/api/users/route.ts
import { withErrorHandler } from '@/lib/api-error-handler'

export const GET = withErrorHandler(async (request) => {
  return NextResponse.json({ success: true, data: [] })
})
```

2. **Test the endpoint**:
```bash
curl http://localhost:3000/api/users
```

3. **Update API documentation**:
```markdown
# docs/API.md
## Users API
GET /users - List all users
```

### Adding a New React Component

1. **Create component file**:
```typescript
// src/components/my-component.tsx
interface Props {
  title: string
}

export function MyComponent({ title }: Props) {
  return <div>{title}</div>
}
```

2. **Add tests**:
```typescript
// src/components/my-component.test.tsx
import { render, screen } from '@testing-library/react'
import { MyComponent } from './my-component'

describe('MyComponent', () => {
  it('renders title', () => {
    render(<MyComponent title="Test" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
```

3. **Use in app**:
```typescript
import { MyComponent } from '@/components/my-component'

export default function Page() {
  return <MyComponent title="Welcome" />
}
```

### Database Migration

1. **Create migration**:
```bash
npm run migrate:create -- add_users_table
```

2. **Edit migration file**:
```sql
-- UP
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- DOWN
DROP TABLE IF EXISTS users;
```

3. **Apply migration**:
```bash
npm run migrate:up
```

## Debugging

### Browser DevTools

```bash
# Open DevTools
F12 or Cmd+Option+I

# View console
Console tab → Check for errors

# Debug component state
React DevTools → Profiler tab
```

### Sentry Error Tracking

Access at: https://sentry.io/

View:
- All errors from production
- Stack traces with source maps
- User session context
- Breadcrumb trail

### Logs

**Local Logs**:
```bash
# Development logs are pretty-printed
npm run dev
# Watch for console output
```

**Production Logs**:
```bash
# Via Wrangler
wrangler logs --env production

# Or check monitoring dashboard
# https://pattern-compliance.deltaops.ca/monitoring
```

### Performance Profiling

```bash
# Lighthouse audit
npm run lighthouse

# Chrome DevTools Performance tab
# Record and analyze

# Network tab
# Check waterfall and latency
```

## Security Best Practices

1. **Never commit secrets**:
   - Use `.env.local` (in .gitignore)
   - Use GitHub secrets for CI/CD

2. **Validate all input**:
   - Use validation utilities
   - Don't trust user input

3. **Sanitize output**:
   - Prevent XSS attacks
   - Use sanitization functions

4. **HTTPS always**:
   - Use secure connections
   - Set secure cookies

5. **Rate limiting**:
   - Implement per-endpoint limits
   - Prevent DoS/brute force

## Performance Optimization

### Code Splitting

```typescript
// ✓ Good - lazy load heavy components
const HeavyComponent = dynamic(
  () => import('./HeavyComponent'),
  { loading: () => <Skeleton /> }
)
```

### Memoization

```typescript
// ✓ Good - memoize expensive computations
export const MyComponent = memo(function MyComponent(props: Props) {
  return <div>{props.title}</div>
})
```

### Image Optimization

```typescript
// ✓ Good - use Next.js Image component
import Image from 'next/image'

<Image src="/hero.jpg" alt="Hero" width={800} height={600} />
```

## Troubleshooting

### Common Issues

**Port already in use**:
```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

**Module not found**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

**Build failures**:
```bash
# Clear cache
npm run build -- --no-cache

# Check for TypeScript errors
npm run type-check
```

**Test failures**:
```bash
# Update snapshots
npm run test -- -u

# Debug specific test
npm run test -- my-test.test.ts --verbose
```

## Resources

- **Next.js Docs**: https://nextjs.org/docs
- **React Docs**: https://react.dev
- **TypeScript Docs**: https://www.typescriptlang.org/docs
- **Cloudflare Workers**: https://developers.cloudflare.com/workers
- **Playwright**: https://playwright.dev

## Getting Help

1. **Check documentation**:
   - `/docs` folder
   - README.md
   - Code comments

2. **Search issues**:
   - GitHub Issues
   - Stack Overflow
   - Google

3. **Ask the team**:
   - Slack #dev channel
   - Team meetings
   - Code review discussions

---

**Last Updated**: 2025-12-09
**Version**: 1.0
