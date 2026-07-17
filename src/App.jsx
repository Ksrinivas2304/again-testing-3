import { useEffect, useMemo, useState } from 'react';
import { Check, Circle, Loader2, PencilLine, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { createTodo, deleteTodo, fetchTodos, updateTodo } from './api-client/todos';
import './App.css';

function TodoSkeleton() {
  return (
    <div className="todo-card skeleton">
      <div className="skeleton-line w-40" />
      <div className="skeleton-line w-72" />
      <div className="skeleton-row">
        <div className="skeleton-pill" />
        <div className="skeleton-pill" />
      </div>
    </div>
  );
}

function App() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const remaining = useMemo(() => todos.filter((todo) => !todo.completed).length, [todos]);

  useEffect(() => {
    let mounted = true;
    fetchTodos()
      .then((data) => {
        if (!mounted) return;
        setTodos(Array.isArray(data) ? data : []);
      })
      .catch((err) => setError(err.message || 'Failed to load todos'))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Todo title cannot be blank.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const todo = await createTodo(title.trim());
      setTodos((current) => [todo, ...current]);
      setTitle('');
    } catch (err) {
      setError(err.message || 'Failed to create todo');
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(todo) {
    setBusyId(todo.id);
    setError('');
    try {
      const updated = await updateTodo(todo.id, { completed: !todo.completed });
      setTodos((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err.message || 'Failed to update todo');
    } finally {
      setBusyId(null);
    }
  }

  function startEdit(todo) {
    setEditingId(todo.id);
    setEditValue(todo.title);
    setError('');
  }

  async function saveEdit(id) {
    if (!editValue.trim()) {
      setError('Todo title cannot be blank.');
      return;
    }
    setBusyId(id);
    try {
      const updated = await updateTodo(id, { title: editValue.trim() });
      setTodos((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setEditingId(null);
    } catch (err) {
      setError(err.message || 'Failed to update todo');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id) {
    setBusyId(id);
    setError('');
    try {
      await deleteTodo(id);
      setTodos((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete todo');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">CRUD TODOS</p>
          <h1>Track tasks, edits, and completion in one clean workspace.</h1>
          <p className="subcopy">Data loads from the backend, updates persist instantly, and every action reflects after refresh.</p>
        </div>
        <form className="todo-form" onSubmit={handleCreate}>
          <label htmlFor="todo-title">New todo</label>
          <div className="input-row">
            <input id="todo-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a task title" />
            <button type="submit" disabled={creating} className="primary-btn">
              {creating ? <Loader2 className="icon spin" /> : <Plus className="icon" />}
              Add
            </button>
          </div>
        </form>
        <div className="meta-row">
          <span>{todos.length} total</span>
          <span>{remaining} active</span>
        </div>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="list-panel">
        <div className="panel-header">
          <h2>Your todos</h2>
          <button type="button" className="ghost-btn" onClick={() => window.location.reload()}>
            <RefreshCw className="icon" /> Reload
          </button>
        </div>

        {loading ? (
          <div className="skeleton-stack">
            <TodoSkeleton />
            <TodoSkeleton />
            <TodoSkeleton />
          </div>
        ) : todos.length === 0 ? (
          <div className="empty-state">
            <Circle className="empty-icon" />
            <h3>No todos yet</h3>
            <p>Create your first task above to start tracking progress.</p>
          </div>
        ) : (
          <div className="todo-stack">
            {todos.map((todo) => (
              <article key={todo.id} className={`todo-card ${todo.completed ? 'completed' : ''}`}>
                <button
                  type="button"
                  className="check-btn"
                  aria-label={todo.completed ? 'Mark todo as incomplete' : 'Mark todo as complete'}
                  onClick={() => handleToggle(todo)}
                  disabled={busyId === todo.id}
                >
                  {todo.completed ? <Check className="icon" /> : <Circle className="icon" />}
                </button>

                <div className="todo-content">
                  {editingId === todo.id ? (
                    <div className="edit-row">
                      <input value={editValue} onChange={(e) => setEditValue(e.target.value)} aria-label="Edit todo title" />
                      <button type="button" className="primary-btn" onClick={() => saveEdit(todo.id)} disabled={busyId === todo.id}>
                        Save
                      </button>
                      <button type="button" className="ghost-btn" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3>{todo.title}</h3>
                      <p>{todo.completed ? 'Completed' : 'Active'}</p>
                    </>
                  )}
                </div>

                <div className="actions">
                  <button type="button" className="ghost-btn" onClick={() => startEdit(todo)} disabled={busyId === todo.id}>
                    <PencilLine className="icon" /> Edit
                  </button>
                  <button type="button" className="danger-btn" onClick={() => handleDelete(todo.id)} disabled={busyId === todo.id}>
                    <Trash2 className="icon" /> Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
