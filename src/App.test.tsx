import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const fetchMock = vi.fn();

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders todos and supports create, update, and delete flows', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 200, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ([{ id: 1, text: 'First task', completed: false }]) })
      .mockResolvedValueOnce({ ok: true, status: 200, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({ id: 2, text: 'Second task', completed: false }) })
      .mockResolvedValueOnce({ ok: true, status: 200, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({ id: 1, text: 'First task', completed: true }) })
      .mockResolvedValueOnce({ ok: true, status: 200, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({ id: 2, text: 'Second task updated', completed: false }) })
      .mockResolvedValueOnce({ ok: true, status: 200, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({ ok: true }) });

    render(<App />);

    expect(await screen.findByText('First task')).toBeInTheDocument();

    const input = screen.getByLabelText('New todo');
    await userEvent.type(input, 'Second task');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(await screen.findByText('Second task')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /mark todo as complete/i }));
    await waitFor(() => expect(screen.getByText('First task')).toHaveClass('completed'));

    await userEvent.click(screen.getAllByRole('button', { name: /edit/i })[0]);
    const editInput = screen.getByLabelText('Edit todo text');
    await userEvent.clear(editInput);
    await userEvent.type(editInput, 'Second task updated');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Second task updated')).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: /delete/i })[0]);
    await waitFor(() => expect(screen.queryByText('First task')).not.toBeInTheDocument());
  });

  it('shows an error state when loading fails', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ detail: 'boom' }),
    });

    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent('boom');
  });
});
