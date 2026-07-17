import { expect, test } from '@playwright/test';

test.describe('todo app', () => {
  test('loads todos, creates, toggles, and deletes through mocked API', async ({ page }) => {
    const todos = [{ id: 1, text: 'First todo', completed: false }];

    await page.route('**/api/todos', async route => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(todos),
        });
        return;
      }
      if (method === 'POST') {
        const body = route.request().postDataJSON() as { text: string };
        const created = { id: 2, text: body.text, completed: false };
        todos.push(created);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(created),
        });
        return;
      }
      await route.continue();
    });

    await page.route('**/api/todos/*', async route => {
      const method = route.request().method();
      const id = Number(route.request().url().split('/').pop());
      const todo = todos.find(item => item.id === id);

      if (method === 'PUT' && todo) {
        const body = route.request().postDataJSON() as { text: string; completed: boolean };
        Object.assign(todo, body);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(todo),
        });
        return;
      }

      if (method === 'DELETE') {
        const index = todos.findIndex(item => item.id === id);
        if (index !== -1) todos.splice(index, 1);
        await route.fulfill({ status: 204, body: '' });
        return;
      }

      await route.continue();
    });

    await page.goto('/');
    await expect(page.getByText('First todo')).toBeVisible();
  });
});
