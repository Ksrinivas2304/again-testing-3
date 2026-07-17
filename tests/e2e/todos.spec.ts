import { test, expect } from '@playwright/test';

test('renders todos from backend data', async ({ page }) => {
  await page.route('**/api/todos', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 1, title: 'First todo', completed: false }]),
    });
  });

  await page.goto('/');

  await expect(page.getByText('First todo')).toBeVisible();
});

test('creates a todo from the UI', async ({ page }) => {
  await page.route('**/api/todos', async route => {
    const request = route.request();
    if (request.method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      return;
    }
    if (request.method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 2, title: 'New todo', completed: false }),
      });
    }
  });

  await page.goto('/');
  await page.getByLabel('New todo').fill('New todo');
  await page.getByRole('button', { name: /add/i }).click();

  await expect(page.getByText('New todo')).toBeVisible();
});

test('toggles completion from the UI', async ({ page }) => {
  await page.route('**/api/todos', async route => {
    const request = route.request();
    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 3, title: 'Toggle todo', completed: false }]),
      });
      return;
    }
    if (request.method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 3, title: 'Toggle todo', completed: true }),
      });
    }
  });

  await page.goto('/');
  await page.getByRole('checkbox').check();

  await expect(page.getByRole('checkbox')).toBeChecked();
});

test('deletes a todo from the UI', async ({ page }) => {
  await page.route('**/api/todos', async route => {
    const request = route.request();
    if (request.method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 4, title: 'Delete todo', completed: false }]),
      });
      return;
    }
    if (request.method() === 'DELETE') {
      await route.fulfill({ status: 204, body: '' });
    }
  });

  await page.goto('/');
  await page.getByRole('button', { name: /delete/i }).click();

  await expect(page.getByText('Delete todo')).not.toBeVisible();
});
