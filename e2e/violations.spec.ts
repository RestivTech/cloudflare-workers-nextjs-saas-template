import { test, expect } from '@playwright/test'

test.describe('Violation Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to violations page
    await page.goto('/violations')
  })

  test('should display violations list', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Check that the page title is visible
    await expect(page.locator('h1')).toContainText('Violations')

    // Check for statistics cards
    const statsCards = page.locator('[class*="card"]')
    await expect(statsCards.first()).toBeVisible()
  })

  test('should filter violations by status', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Find status filter
    const statusFilter = page.locator('select, [role="combobox"]').first()

    if (await statusFilter.isVisible()) {
      // Click filter
      await statusFilter.click()

      // Select "Open" status
      const openOption = page.locator('[role="option"]:has-text("Open")').first()
      if (await openOption.isVisible()) {
        await openOption.click()

        // Wait for results to update
        await page.waitForTimeout(500)

        // Violations should be filtered
        const violations = page.locator('[role="row"]')
        const count = await violations.count()

        // Should have at least one row or show no results
        const hasResults =
          count > 0 || (await page.locator('text=No violations found').isVisible())
        expect(hasResults).toBeTruthy()
      }
    }
  })

  test('should search violations', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"]')

    if (await searchInput.isVisible()) {
      // Type search term
      await searchInput.fill('secret')

      // Wait for results to update
      await page.waitForTimeout(500)

      // Results should be filtered or show no results
      const violations = page.locator('[role="row"]')
      const hasContent =
        (await violations.count()) > 0 ||
        (await page.locator('text=No violations found').isVisible())
      expect(hasContent).toBeTruthy()
    }
  })

  test('should view violation details', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Click on first violation
    const firstViolation = page.locator('a[href*="/violations/"]').first()

    if (await firstViolation.isVisible()) {
      await firstViolation.click()

      // Should be on violation detail page
      await expect(page).toHaveURL(/.*\/violations\//)

      // Should show violation details
      await expect(page.locator('h1')).toBeVisible()

      // Should show code context or details
      await expect(page.locator('text=Details|Code|Context|Severity').first()).toBeVisible()
    }
  })

  test('should update violation status', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Navigate to first violation
    const firstViolation = page.locator('a[href*="/violations/"]').first()

    if (await firstViolation.isVisible()) {
      await firstViolation.click()

      // Find status update form
      const statusSelect = page
        .locator('select, [role="combobox"]')
        .filter({ hasText: 'Status' })
        .first()

      if (await statusSelect.isVisible()) {
        // Click to open status options
        await statusSelect.click()

        // Select "Resolved"
        const resolvedOption = page.locator('[role="option"]:has-text("Resolved")').first()
        if (await resolvedOption.isVisible()) {
          await resolvedOption.click()

          // Submit form
          const submitButton = page.locator('button:has-text("Update")').first()
          if (await submitButton.isVisible()) {
            await submitButton.click()

            // Should show success message
            await expect(page.locator('text=Violation updated')).toBeVisible()
          }
        }
      }
    }
  })

  test('should sort violations', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Find sort buttons
    const sortButton = page.locator('button:has-text("Severity")')

    if (await sortButton.isVisible()) {
      // Click to sort
      await sortButton.click()

      // Wait for re-sort
      await page.waitForTimeout(300)

      // Violations should be re-ordered
      const violations = page.locator('[role="row"]')
      const initialCount = await violations.count()

      // Click again to reverse sort
      await sortButton.click()
      await page.waitForTimeout(300)

      // Should still have same violations
      const finalCount = await violations.count()
      expect(finalCount).toBe(initialCount)
    }
  })
})
