import { useEffect, useMemo, useState } from 'react';
import { CheckCheck, PencilLine, Plus, RefreshCcw, Trash2 } from 'lucide-react';
import { createTodo, deleteTodo, fetchTodos, updateTodo } from './api-client/todos';
import './App.css';

function TodoSkeleton() {
  return (
    <div className="todo-card todo-skeleton" aria-hidden="true">
      <div className="skeleton-line skeleton-title" />
      <div className="skeleton-line skeleton-body" />
    </div>
  );
}

function App() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newText, setNewText] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [busyIds, setBusyIds] = useState([]);

  const stats = useMemo(() => ({
    total: todos.length,
    completed: todos.filter((todo) => todo.completed).length,
  }), [todos]);

  async function loadTodos() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchTodos();
      setTodos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load todos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTodos();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    const text = newText.trim();
    if (!text) return;
    setSaving(true);
    setError('');
    try {
      const todo = await createTodo(text);
      setTodos((current) => [...current, todo]);
      setNewText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create todo');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(todo) {
    setBusyIds((current) => [...current, todo.id]);
    setError('');
    try {
      const updated = await updateTodo(todo.id, { text: todo.text, completed: !todo.completed });
      setTodos((current) => current.map((item) => (item.id === todo.id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update todo');
    } finally {
      setBusyIds((current) => current.filter((id) => id !== todo.id));
    }
  }

  async function handleDelete(id) {
    setBusyIds((current) => [...current, id]);
    setError('');
    try {
      await deleteTodo(id);
      setTodos((current) => current.filter((todo) => todo.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete todo');
    } finally {
      setBusyIds((current) => current.filter((itemId) => itemId !== id));
    }
  }

  async function handleSaveEdit(todo) {
    const nextText = editingText.trim();
    if (!nextText) return;
    setBusyIds((current) => [...current, todo.id]);
    try {
      const updated = await updateTodo(todo.id, { text: nextText, completed: todo.completed });
      setTodos((current) => current.map((item) => (item.id === todo.id ? updated : item)));
      setEditingId(null);
      setEditingText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update todo');
    } finally {
      setBusyIds((current) => current.filter((id) => id !== todo.id));
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Todo dashboard</p>
          <h1>Track tasks, edit text, and sync with your backend.</h1>
          <p className="hero-copy">Create, update, complete, and delete todos with live API data from <code>/api/todos</code>.</p>
        </div>
        <button className="secondary-button" onClick={loadTodos} type="button">
          <RefreshCcw size={16} /> Refresh
        </button>
      </section>

      <section className="stats-row" aria-label="Todo summary">
        <article className="stat-card"><span>Total</span><strong>{stats.total}</strong></article>
        <article className="stat-card"><span>Completed</span><strong>{stats.completed}</strong></article>
        <article className="stat-card"><span>Open</span><strong>{stats.total - stats.completed}</strong></article>
      </section>

      <section className="panel">
        <form className="todo-form" onSubmit={handleCreate}>
          <label htmlFor="todo-text">New todo</label>
          <div className="form-row">
            <input id="todo-text" value={newText} onChange={(e) => setNewText(e.target.value)} placeholder="Write a task" />
            <button className="primary-button" disabled={saving || !newText.trim()} type="submit">
              <Plus size={16} /> {saving ? 'Adding…' : 'Add todo'}
            </button>
          </div>
        </form>

        {error ? <div className="error-banner" role="alert">{error}</div> : null}

        {loading ? (
          <div className="todo-list" aria-busy="true">{Array.from({ length: 3 }).map((_, index) => <TodoSkeleton key={index} />)}</div>
        ) : todos.length === 0 ? (
          <div className="empty-state">
            <CheckCheck size={28} />
            <h2>No todos yet</h2>
            <p>Create your first todo to get started.</p>
          </div>
        ) : (
          <div className="todo-list">
            {todos.map((todo) => {
              const busy = busyIds.includes(todo.id);
              const editing = editingId === todo.id;
              return (
                <article className={`todo-card ${todo.completed ? 'completed' : ''}`} key={todo.id}>
                  <label className="todo-check">
                    <input checked={todo.completed} disabled={busy} onChange={() => handleToggle(todo)} type="checkbox" />
                    <span>{todo.completed ? 'Completed' : 'Active'}</span>
                  </label>

                  {editing ? (
                    <div className="edit-row">
                      <input value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                      <button className="primary-button" onClick={() => handleSaveEdit(todo)} type="button">Save</button>
                      <button className="ghost-button" onClick={() => { setEditingId(null); setEditingText(''); }} type="button">Cancel</button>
                    </div>
                  ) : (
                    <p className="todo-text">{todo.text}</p>
                  )}

                  <div className="todo-actions">
                    <button className="ghost-button" disabled={busy} onClick={() => { setEditingId(todo.id); setEditingText(todo.text); }} type="button">
                      <PencilLine size={16} /> Edit
                    </button>
                    <button className="danger-button" disabled={busy} onClick={() => handleDelete(todo.id)} type="button">
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
