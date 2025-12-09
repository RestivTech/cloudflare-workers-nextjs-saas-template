import { test, expect } from '@playwright/test'

test.describe('Approvals Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to approvals page
    await page.goto('/approvals')
  })

  test('should display approvals queue', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Check that the page title is visible
    await expect(page.locator('h1')).toContainText('Approvals')

    // Check for statistics
    const statsCards = page.locator('[class*="stat"], [class*="card"]')
    const cardCount = await statsCards.count()

    // Should have at least some cards (pending, approved, rejected counts)
    expect(cardCount).toBeGreaterThan(0)
  })

  test('should display approval statistics', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Check for pending count
    const pendingCount = page.locator('text=Pending').first()
    await expect(pendingCount).toBeVisible()

    // Check for approved count
    const approvedCount = page.locator('text=Approved').first()
    await expect(approvedCount).toBeVisible()

    // Check for rejected count
    const rejectedCount = page.locator('text=Rejected').first()
    await expect(rejectedCount).toBeVisible()
  })

  test('should filter approvals by status', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Find status filter
    const statusFilter = page.locator('select, [role="combobox"]').first()

    if (await statusFilter.isVisible()) {
      // Click filter
      await statusFilter.click()

      // Select "Pending" status
      const pendingOption = page.locator('[role="option"]:has-text("Pending")').first()
      if (await pendingOption.isVisible()) {
        await pendingOption.click()

        // Wait for results to update
        await page.waitForTimeout(500)

        // Approvals should be filtered
        const approvals = page.locator('[role="row"]')
        const count = await approvals.count()

        // Should have at least one row or show no results
        const hasResults =
          count > 0 || (await page.locator('text=No approvals').isVisible())
        expect(hasResults).toBeTruthy()
      }
    }
  })

  test('should navigate to approval detail', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Click on first approval
    const firstApproval = page.locator('a[href*="/approvals/"]').first()

    if (await firstApproval.isVisible()) {
      await firstApproval.click()

      // Should be on approval detail page
      await expect(page).toHaveURL(/.*\/approvals\//)

      // Should show violation details
      await expect(page.locator('h1')).toBeVisible()

      // Should show decision options
      const approveButton = page.locator('input[value="approve"]')
      const rejectButton = page.locator('input[value="reject"]')

      // At least one decision option should be visible
      const hasDecisionOption =
        (await approveButton.isVisible()) || (await rejectButton.isVisible())
      expect(hasDecisionOption).toBeTruthy()
    }
  })

  test('should make approval decision', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Navigate to first approval
    const firstApproval = page.locator('a[href*="/approvals/"]').first()

    if (await firstApproval.isVisible()) {
      await firstApproval.click()

      // Select approve option
      const approveRadio = page.locator('input[value="approve"]').first()
      if (await approveRadio.isVisible()) {
        await approveRadio.check()

        // Add optional reason
        const reasonTextarea = page.locator('textarea[name="reason"]')
        if (await reasonTextarea.isVisible()) {
          await reasonTextarea.fill('This violation is acceptable in this context')
        }

        // Submit decision
        const submitButton = page.locator('button:has-text("Submit")').first()
        if (await submitButton.isVisible()) {
          await submitButton.click()

          // Should redirect back to approvals
          await expect(page).toHaveURL(/.*\/approvals/)

          // Should show success message
          await expect(page.locator('text=Decision submitted|Approval completed')).toBeVisible()
        }
      }
    }
  })

  test('should search approvals', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"]')

    if (await searchInput.isVisible()) {
      // Type search term
      await searchInput.fill('hardcoded')

      // Wait for results to update
      await page.waitForTimeout(500)

      // Results should be filtered or show no results
      const approvals = page.locator('[role="row"]')
      const hasContent =
        (await approvals.count()) > 0 ||
        (await page.locator('text=No approvals').isVisible())
      expect(hasContent).toBeTruthy()
    }
  })
})
