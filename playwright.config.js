import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 20_000,
    fullyParallel: false,        // app uses localStorage; serial avoids cross-test bleed
    workers: 1,
    reporter: 'list',
    use: {
        baseURL: 'http://127.0.0.1:8080',
        trace: 'retain-on-failure',
        // Reuse the system Chrome instead of downloading a Playwright-managed browser.
        channel: 'chrome',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ],
    webServer: {
        command: 'npm run start:test',
        url: 'http://127.0.0.1:8080',
        reuseExistingServer: true,
        timeout: 30_000,
        stdout: 'ignore',
        stderr: 'pipe',
    },
});
