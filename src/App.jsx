import { useEffect, useMemo, useState } from 'react';
import { createTodo, deleteTodo, fetchTodos, updateTodo } from './api-client/todos';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    let active = true;
    fetchTodos()
      .then((data) => {
        if (!active) return;
        setTodos(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!active) return;
        setError('Unable to load todos. Please try again.');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const remainingCount = useMemo(() => todos.filter((todo) => !todo.completed).length, [todos]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!text.trim()) return;
    const created = await createTodo(text.trim());
    setTodos((current) => [created, ...current]);
    setText('');
  }

  async function handleToggle(todo) {
    setSavingId(todo.id);
    const updated = await updateTodo(todo.id, { text: todo.text, completed: !todo.completed });
    setTodos((current) => current.map((item) => (item.id === todo.id ? updated : item)));
    setSavingId(null);
  }

  async function handleDelete(todoId) {
    setSavingId(todoId);
    await deleteTodo(todoId);
    setTodos((current) => current.filter((item) => item.id !== todoId));
    setSavingId(null);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Todo stack</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Stay on top of your work</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Create, complete, and remove tasks with a clean contract-driven interface.</p>
        </header>

        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/30">
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="todo-text">Todo text</label>
            <input
              id="todo-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Add a new todo"
              className="flex-1 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/40"
            />
            <button className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus:ring-2 focus:ring-cyan-300" type="submit">Add todo</button>
          </form>
          <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
            <span>{remainingCount} active</span>
            <span>{todos.length} total</span>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/30">
          {loading ? (
            <div className="space-y-3" aria-label="Loading todos">
              <div className="h-16 animate-pulse rounded-2xl bg-white/5" />
              <div className="h-16 animate-pulse rounded-2xl bg-white/5" />
              <div className="h-16 animate-pulse rounded-2xl bg-white/5" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
              {error}
            </div>
          ) : todos.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">No todos yet. Add your first task to get started.</p>
          ) : (
            <ul className="space-y-3">
              {todos.map((todo) => (
                <li key={todo.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-400/30">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggle(todo)}
                    disabled={savingId === todo.id}
                    aria-label={`Mark ${todo.text} as ${todo.completed ? 'incomplete' : 'complete'}`}
                    className="h-4 w-4 rounded border-white/30 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className={`flex-1 text-sm ${todo.completed ? 'text-slate-500 line-through' : 'text-slate-100'}`}>{todo.text}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(todo.id)}
                    disabled={savingId === todo.id}
                    className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:border-rose-400/40 hover:text-rose-200 focus:ring-2 focus:ring-rose-400/40"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
