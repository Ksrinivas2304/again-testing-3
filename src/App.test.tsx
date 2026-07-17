import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';

const todos = [{ id: 1, text: 'Write tests', completed: false }];

vi.mock('./api-client/todos', () => ({
  fetchTodos: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
}));

import { createTodo, deleteTodo, fetchTodos, updateTodo } from './api-client/todos';

describe('todo app', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads todos from the API', async () => {
    fetchTodos.mockResolvedValueOnce(todos);
    render(<App />);

    expect(screen.getByLabelText('Loading todos')).toBeInTheDocument();
    expect(await screen.findByText('Write tests')).toBeInTheDocument();
    expect(fetchTodos).toHaveBeenCalledWith();
  });

  it('creates a todo through the API contract', async () => {
    fetchTodos.mockResolvedValueOnce([]);
    createTodo.mockResolvedValueOnce({ id: 2, text: 'Ship it', completed: false });
    render(<App />);

    await screen.findByText('No todos yet. Add your first task to get started.');
    fireEvent.change(screen.getByLabelText('Todo text'), { target: { value: 'Ship it' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add todo' }));

    await screen.findByText('Ship it');
    expect(createTodo).toHaveBeenCalledWith('Ship it');
  });

  it('updates completion via PUT and deletes via DELETE', async () => {
    fetchTodos.mockResolvedValueOnce(todos);
    updateTodo.mockResolvedValueOnce({ id: 1, text: 'Write tests', completed: true });
    deleteTodo.mockResolvedValueOnce({ success: true });
    render(<App />);

    await screen.findByText('Write tests');
    fireEvent.click(screen.getByLabelText('Mark Write tests as complete'));

    await waitFor(() => expect(updateTodo).toHaveBeenCalledWith(1, { text: 'Write tests', completed: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(deleteTodo).toHaveBeenCalledWith(1));
  });
});
