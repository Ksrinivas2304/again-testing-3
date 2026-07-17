import { useEffect, useMemo, useState } from 'react';
import { Check, Circle, Loader2, PencilLine, Plus, RefreshCcw, Trash2 } from 'lucide-react';
import { createTodo, deleteTodo, fetchTodos, updateTodo } from './api-client/todos';

function TodoSkeleton() {
  return (
    <div className="todo-card animate-pulse">
      <div className="h-4 w-32 rounded bg-slate-200" />
      <div className="mt-3 h-3 w-full rounded bg-slate-200" />
      <div className="mt-2 h-3 w-5/6 rounded bg-slate-200" />
    </div>
  );
}

export default function App() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draftText, setDraftText] = useState('');

  const completedCount = useMemo(() => todos.filter((todo) => todo.completed).length, [todos]);

  async function loadTodos() {
    setLoading(true);
    setError('');
    try {
      const items = await fetchTodos();
      setTodos(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load todos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTodos();
  }, []);

  async function handleCreate(event) {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;

    setSaving(true);
    setError('');
    try {
      const created = await createTodo(value);
      setTodos((current) => [created, ...current]);
      setText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create todo');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(todo) {
    setUpdatingId(todo.id);
    setError('');
    try {
      const updated = await updateTodo(todo.id, { completed: !todo.completed });
      setTodos((current) => current.map((item) => (item.id === todo.id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update todo');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleSave(todo) {
    const nextText = draftText.trim();
    if (!nextText) return;

    setUpdatingId(todo.id);
    setError('');
    try {
      const updated = await updateTodo(todo.id, { text: nextText });
      setTodos((current) => current.map((item) => (item.id === todo.id ? updated : item)));
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update todo');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    setError('');
    try {
      await deleteTodo(id);
      setTodos((current) => current.filter((item) => item.id !== id));
      if (editingId === id) setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete todo');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">TodoFlow</p>
          <h1>Ship your to-do list with a clean CRUD workflow.</h1>
          <p className="hero-text">Track tasks, edit items inline, and keep everything synced with the FastAPI backend.</p>
          <div className="stats-row">
            <div>
              <span className="stat-value">{todos.length}</span>
              <span className="stat-label">Total</span>
            </div>
            <div>
              <span className="stat-value">{completedCount}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
        </div>

        <form className="todo-form" onSubmit={handleCreate}>
          <label htmlFor="todo-text">New todo</label>
          <div className="form-row">
            <input id="todo-text" value={text} onChange={(event) => setText(event.target.value)} placeholder="Add a task" />
            <button type="submit" disabled={saving || !text.trim()} aria-disabled={saving || !text.trim()}>
              {saving ? <Loader2 className="icon spin" /> : <Plus className="icon" />} Add
            </button>
          </div>
        </form>
      </section>

      <section className="list-card">
        <div className="list-header">
          <div>
            <h2>Todos</h2>
            <p>Use the controls below to update or remove items.</p>
          </div>
          <button type="button" className="ghost-button" onClick={loadTodos}>
            <RefreshCcw className="icon" /> Refresh
          </button>
        </div>

        {error ? <div className="error-banner" role="alert">{error}</div> : null}

        {loading ? (
          <div className="skeleton-grid" aria-label="Loading todos">
            <TodoSkeleton />
            <TodoSkeleton />
            <TodoSkeleton />
          </div>
        ) : todos.length === 0 ? (
          <div className="empty-state">
            <p>No todos yet.</p>
            <span>Create your first todo above to get started.</span>
          </div>
        ) : (
          <ul className="todo-list">
            {todos.map((todo) => {
              const isEditing = editingId === todo.id;
              return (
                <li key={todo.id} className="todo-card">
                  <button type="button" className="toggle-button" onClick={() => handleToggle(todo)} disabled={updatingId === todo.id} aria-label={todo.completed ? 'Mark todo as incomplete' : 'Mark todo as complete'}>
                    {todo.completed ? <Check className="icon success" /> : <Circle className="icon" />}
                  </button>

                  <div className="todo-body">
                    {isEditing ? (
                      <input className="edit-input" value={draftText} onChange={(event) => setDraftText(event.target.value)} aria-label="Edit todo text" />
                    ) : (
                      <p className={todo.completed ? 'completed' : ''}>{todo.text}</p>
                    )}
                  </div>

                  <div className="todo-actions">
                    {isEditing ? (
                      <button type="button" className="primary-button" onClick={() => handleSave(todo)} disabled={updatingId === todo.id || !draftText.trim()}>
                        Save
                      </button>
                    ) : (
                      <button type="button" className="secondary-button" onClick={() => { setEditingId(todo.id); setDraftText(todo.text); }}>
                        <PencilLine className="icon" /> Edit
                      </button>
                    )}
                    <button type="button" className="danger-button" onClick={() => handleDelete(todo.id)} disabled={deletingId === todo.id}>
                      {deletingId === todo.id ? <Loader2 className="icon spin" /> : <Trash2 className="icon" />} Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
