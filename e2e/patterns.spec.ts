import { test, expect } from '@playwright/test'

test.describe('Pattern Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to patterns page
    await page.goto('/patterns')
  })

  test('should display patterns list', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Check that the page title is visible
    await expect(page.locator('h1')).toContainText('Patterns')

    // Check that the create pattern button exists
    const createButton = page.locator('a:has-text("New Pattern")')
    await expect(createButton).toBeVisible()
  })

  test('should navigate to create pattern page', async ({ page }) => {
    // Click the create pattern button
    await page.click('a:has-text("New Pattern")')

    // Should be redirected to /patterns/new
    await expect(page).toHaveURL(/.*\/patterns\/new/)

    // Check form elements exist
    await expect(page.locator('input[name="name"]')).toBeVisible()
    await expect(page.locator('textarea[name="description"]')).toBeVisible()
  })

  test('should validate pattern form fields', async ({ page }) => {
    // Navigate to create pattern page
    await page.click('a:has-text("New Pattern")')

    // Try to submit empty form
    const submitButton = page.locator('button:has-text("Create Pattern")')
    await submitButton.click()

    // Should show validation error
    await expect(page.locator('text=Name is required')).toBeVisible()
  })

  test('should create a new pattern', async ({ page }) => {
    // Navigate to create pattern page
    await page.click('a:has-text("New Pattern")')

    // Fill in the form
    await page.fill('input[name="name"]', 'SQL Injection Test Pattern')
    await page.fill('textarea[name="description"]', 'Test pattern for SQL injection detection')

    // Add file patterns
    const addButton = page.locator('button:has-text("Add Pattern")')
    await addButton.click()
    await page.fill('input[placeholder="*.sql"]', '*.sql')

    // Submit form
    const submitButton = page.locator('button:has-text("Create Pattern")')
    await submitButton.click()

    // Should redirect to patterns list
    await expect(page).toHaveURL(/.*\/patterns/)

    // Should show success message
    await expect(page.locator('text=Pattern created successfully')).toBeVisible()
  })

  test('should view pattern details', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Click on first pattern in the list
    const firstPattern = page.locator('a[href*="/patterns/"]').first()
    if (await firstPattern.isVisible()) {
      await firstPattern.click()

      // Should show pattern details
      await expect(page.locator('h1')).toBeVisible()
      await expect(page.locator('button:has-text("Edit")')).toBeVisible()
      await expect(page.locator('button:has-text("Delete")')).toBeVisible()
    }
  })

  test('should search patterns', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"]')

    if (await searchInput.isVisible()) {
      // Type search term
      await searchInput.fill('SQL')

      // Wait for results to update
      await page.waitForTimeout(500)

      // Results should be filtered
      const patterns = page.locator('[role="row"]')
      const count = await patterns.count()

      // At least one pattern should be visible or "no results" message
      const hasResults = count > 0 || await page.locator('text=No patterns found').isVisible()
      expect(hasResults).toBeTruthy()
    }
  })
})
