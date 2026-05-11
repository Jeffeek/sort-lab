import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    // Playwright gives each test a fresh browser context, so localStorage is
    // empty by default — no manual clear needed (and a clear via addInitScript
    // would fire on every reload, breaking persistence tests).
    await page.goto('/');
});

test('single mode runs a sort to completion', async ({ page }) => {
    await page.fill('#arraySize', '20');
    await page.fill('#opsPerFrame', '500');
    await page.selectOption('#algorithm', 'quick');
    await page.click('#btnStart');
    // Pause becomes disabled again only after the run reaches 'done'.
    await expect(page.locator('#btnPause')).toBeDisabled({ timeout: 10_000 });
    // Stats footer reports a non-zero elapsed.
    await expect(page.locator('#statElapsed')).not.toHaveText('0.00s');
});

test('mode toggle swaps single ↔ compare layout', async ({ page }) => {
    await expect(page.locator('#container')).toBeVisible();
    await expect(page.locator('#panes')).toBeHidden();

    await page.selectOption('#mode', 'compare');
    await expect(page.locator('#container')).toBeHidden();
    await expect(page.locator('#panes')).toBeVisible();
    await expect(page.locator('.pane')).toHaveCount(2);

    await page.selectOption('#mode', 'single');
    await expect(page.locator('#container')).toBeVisible();
    await expect(page.locator('#panes')).toBeHidden();
});

test('compare mode dedupes algorithm options across panes', async ({ page }) => {
    await page.selectOption('#mode', 'compare');
    const panes = page.locator('.pane');
    await expect(panes).toHaveCount(2);

    // Force pane 0 to quick. pane 1 must no longer offer quick.
    await panes.nth(0).locator('.pane-algo').selectOption('quick');
    const otherOptions = await panes.nth(1).locator('.pane-algo option').evaluateAll(
        opts => opts.map(o => o.value),
    );
    expect(otherOptions).not.toContain('quick');
});

test('add / remove panes respects the algorithm-count cap', async ({ page }) => {
    await page.selectOption('#mode', 'compare');
    const panes = page.locator('.pane');
    await expect(panes).toHaveCount(2);

    await page.click('#btnAddPane');
    await expect(panes).toHaveCount(3);

    // Each ✕ removes its pane, but the last one can't be removed (button hidden).
    await panes.nth(0).locator('.pane-remove').click();
    await expect(panes).toHaveCount(2);
    await panes.nth(0).locator('.pane-remove').click();
    await expect(panes).toHaveCount(1);
    await expect(panes.nth(0).locator('.pane-remove')).toBeHidden();
});

test('synchronized race finishes all panes together', async ({ page }) => {
    await page.selectOption('#mode', 'compare');
    await page.selectOption('#pacing', 'scheduled');
    await page.fill('#raceDuration', '2');     // 2-second race
    await page.fill('#arraySize', '40');

    // Pick two algorithms with very different op counts so the race effect is real.
    const panes = page.locator('.pane');
    await panes.nth(0).locator('.pane-algo').selectOption('bubble');
    await panes.nth(1).locator('.pane-algo').selectOption('quick');

    await page.click('#btnStart');
    // After ~3 s both panes are done; pause is disabled when no pane is active.
    await expect(page.locator('#btnPause')).toBeDisabled({ timeout: 10_000 });

    // Race-info shows total ops + ops/sec on both panes after a scheduled run.
    await expect(panes.nth(0).locator('.pane-race-info')).not.toHaveText('');
    await expect(panes.nth(1).locator('.pane-race-info')).not.toHaveText('');
});

test('settings persist across reload', async ({ page }) => {
    await page.fill('#arraySize', '77');
    await page.selectOption('#algorithm', 'merge');
    await page.selectOption('#mode', 'compare');
    // Trigger change events to persist.
    await page.locator('#arraySize').blur();

    await page.reload();
    await expect(page.locator('#mode')).toHaveValue('compare');
    await expect(page.locator('#arraySize')).toHaveValue('77');
    await expect(page.locator('#algorithm')).toHaveValue('merge');
});

test('Race (s) input is hidden when pacing is Ops/frame', async ({ page }) => {
    await page.selectOption('#mode', 'compare');
    const raceLabel = page.locator('label:has(#raceDuration)');
    await page.selectOption('#pacing', 'budget');
    await expect(raceLabel).toBeHidden();
    await page.selectOption('#pacing', 'scheduled');
    await expect(raceLabel).toBeVisible();
});

test('renderer hot-swap preserves an in-progress sort', async ({ page }) => {
    await page.fill('#arraySize', '120');
    await page.fill('#opsPerFrame', '1');      // slow enough to still be running after the swap
    await page.selectOption('#algorithm', 'bubble');
    await page.click('#btnStart');

    // While running, switch the renderer. Player state should remain running/paused, not idle.
    await page.waitForTimeout(150);
    await page.selectOption('#renderer', 'circular');
    await page.waitForTimeout(150);
    const pauseDisabled = await page.locator('#btnPause').isDisabled();
    expect(pauseDisabled).toBe(false);
});
