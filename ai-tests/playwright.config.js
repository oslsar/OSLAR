const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',

  timeout: 30000,

  use: {
    baseURL: 'http://web:3000',
    headless: true,

    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',

    viewport: {
      width: 1440,
      height: 900
    }
  },

  reporter: [
    ['list'],
    ['html', {
      outputFolder: 'playwright-report',
      open: 'never'
    }]
  ]
});
