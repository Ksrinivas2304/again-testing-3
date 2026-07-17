const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw new Error(
      data && typeof data === 'object' && 'detail' in data
        ? String(data.detail)
        : `Request failed with status ${response.status}`,
    );
  }

  return data;
}

export function fetchTodos() {
  return request('/api/todos');
}

export function createTodo(text) {
  return request('/api/todos', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export function updateTodo(id, payload) {
  return request(`/api/todos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteTodo(id) {
  return request(`/api/todos/${id}`, {
    method: 'DELETE',
  });
}
