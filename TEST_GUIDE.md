# Phase 3: Integration Testing & Performance Guide

## Overview

This guide covers the comprehensive testing strategy for the Pattern Compliance Dashboard including E2E tests, performance benchmarking, and load testing.

## Testing Framework

### Playwright E2E Tests

**Purpose**: Validate user workflows and dashboard functionality across multiple browsers and devices

**Location**: `e2e/` directory

**Browsers Tested**:
- Chromium (Desktop)
- Firefox (Desktop)
- WebKit/Safari (Desktop)
- Chrome (Mobile)
- Safari (Mobile)

### Lighthouse Performance Audits

**Purpose**: Measure performance metrics (FCP, LCP, TTI, CLS, TBT)

**Metrics**:
- Performance Score (0-100)
- Accessibility Score
- Best Practices Score
- SEO Score

### k6 Load Testing

**Purpose**: Simulate concurrent user load and measure system stability

**Scenarios**:
- Ramp up from 10 to 20 concurrent users
- Maintain 20 concurrent users for 1.5 minutes
- Ramp down to 0

## Running Tests

### Local E2E Testing

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug

# View HTML report
npm run test:e2e:report
```

### Performance Testing

```bash
# Start dev server (separate terminal)
npm run dev

# Run Lighthouse audit
npm run test:perf
```

### Comprehensive Testing

```bash
# Run all tests (lint, build, E2E)
npm run test:all
```

## Test Coverage

### Patterns Workflow
- [x] Display patterns list
- [x] Navigate to create pattern page
- [x] Form validation
- [x] Create new pattern
- [x] View pattern details
- [x] Search patterns

### Violations Workflow
- [x] Display violations list
- [x] Filter by status
- [x] Search violations
- [x] View violation details
- [x] Update violation status
- [x] Sort violations

### Approvals Workflow
- [x] Display approvals queue
- [x] View approval statistics
- [x] Filter by status
- [x] Navigate to approval detail
- [x] Make approval decision
- [x] Search approvals

## GitHub Actions Workflows

### E2E Tests Workflow (`e2e-tests.yml`)

**Triggers**:
- Push to main/develop
- Pull requests to main/develop
- Daily at 2 AM UTC

**Steps**:
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Install Playwright browsers
5. Build application
6. Start dev server
7. Wait for server readiness
8. Run Playwright tests
9. Upload test results
10. Comment PR with results

**Artifacts**:
- `playwright-report/` - HTML test report (30-day retention)
- `test-results/` - Videos for failed tests (7-day retention)

### Performance Tests Workflow (`performance-tests.yml`)

**Triggers**:
- Push to main
- Pull requests to main
- Weekly on Monday at 3 AM UTC

**Contains Two Jobs**:

#### 1. Lighthouse Audit
- Runs full Lighthouse audit
- Generates HTML and JSON reports
- Comments PR with performance metrics
- Tracks key metrics: FCP, LCP, TTI, TBT, CLS

#### 2. Load Testing (k6)
- Simulates 0-20 concurrent users
- Validates response times (p95 < 500ms, p99 < 1000ms)
- Checks error rate < 10%
- Archives results for analysis

## Performance Thresholds

### Lighthouse Targets
- **Performance**: ≥ 90
- **Accessibility**: ≥ 90
- **Best Practices**: ≥ 90
- **SEO**: ≥ 90

### Web Vitals Targets
- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Total Blocking Time (TBT)**: < 200ms

### Load Testing Thresholds
- **p95 Response Time**: < 500ms
- **p99 Response Time**: < 1000ms
- **Error Rate**: < 10%

## Test Results Interpretation

### E2E Tests
- Green checkmark (✅): All tests passed
- Red X (❌): One or more tests failed
- Review `playwright-report/index.html` for detailed results
- Check test videos for failed tests

### Lighthouse Report
- ✅ Score ≥ 90: Excellent
- ⚠️ Score 70-89: Good, but room for improvement
- ❌ Score < 70: Needs attention

### Load Testing
- Check `k6-load-test-results/results.json` for metrics
- Verify thresholds are met
- Look for error spikes or response time increases

## Debugging Failed Tests

### E2E Test Failures

```bash
# Run in debug mode to step through test
npm run test:e2e:debug

# Run in headed mode to see browser
npm run test:e2e:headed

# Run specific test file
npx playwright test e2e/patterns.spec.ts
```

**Common Issues**:
- Server not running: Check that dev server started
- Timeout errors: Increase timeout in playwright.config.ts
- Element not found: Verify selectors match current HTML

### Performance Issues

1. Check Lighthouse report details
2. Look for render-blocking resources
3. Verify image optimization
4. Check code splitting opportunities
5. Profile with Chrome DevTools

## Continuous Integration

### GitHub Actions Integration

Tests run automatically on:
1. **Every push to main/develop**: E2E tests
2. **Every pull request**: E2E tests (blocks merge if failed)
3. **Daily schedule**: E2E tests at 2 AM UTC
4. **Weekly schedule**: Performance tests Monday 3 AM UTC

### PR Comment Integration

- E2E tests: ✅/❌ status with link to detailed report
- Performance: Lighthouse scores table with metrics
- Load test: Results archived for analysis

## Best Practices

### Writing E2E Tests

```typescript
// ✅ Good: Specific, user-focused actions
test('should create a new pattern', async ({ page }) => {
  await page.fill('input[name="name"]', 'Test Pattern')
  await page.click('button:has-text("Create")')
  await expect(page.locator('text=Pattern created')).toBeVisible()
})

// ❌ Bad: Too generic, brittle selectors
test('should work', async ({ page }) => {
  await page.click('div > button')
  await page.waitForTimeout(1000)
})
```

### Performance Testing

- Run on clean environment (fresh build)
- Avoid other heavy processes during test
- Run multiple times for consistency
- Compare against baseline metrics
- Track trends over time

### Load Testing

- Start with realistic user load
- Gradually ramp up to identify breaking points
- Monitor system resources
- Check for memory leaks
- Verify database connection pool

## Future Enhancements

### Planned Improvements
- [ ] Visual regression testing (Percy/Chromatic)
- [ ] Accessibility testing (axe-core integration)
- [ ] API integration testing
- [ ] Database migration testing
- [ ] Performance budget enforcement
- [ ] Custom Lighthouse plugins
- [ ] Advanced k6 scenarios (spike testing, stress testing)

### Metrics Dashboard
- [ ] Display test trends over time
- [ ] Track performance regressions
- [ ] Automated alerts for threshold breaches
- [ ] Performance comparison vs baseline

## Troubleshooting

### Tests timeout waiting for server
```bash
# Increase timeout in playwright.config.ts
webServer: {
  timeout: 180_000, // 3 minutes
}
```

### Playwright browsers not installed
```bash
npx playwright install --with-deps
```

### Port 3000 already in use
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Lighthouse audit fails
- Check internet connection (CDN resources)
- Verify server is responsive
- Try running locally without CI restrictions

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Lighthouse Audit Documentation](https://developers.google.com/web/tools/lighthouse)
- [k6 Load Testing Guide](https://k6.io/docs)
- [Web Vitals Guide](https://web.dev/vitals)

---

**Last Updated**: 2025-12-09
**Phase**: 3 - Integration Testing & Performance
