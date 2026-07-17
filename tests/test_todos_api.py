import pytest


# AC-5: Backend exposes working todo CRUD endpoints with exact JSON contracts.
def test_get_todos_returns_bare_json_array(client):
    resp = client.get("/api/todos")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    for item in data:
        assert set(item.keys()) == {"id", "text", "completed"}
        assert isinstance(item["id"], int)
        assert isinstance(item["text"], str)
        assert isinstance(item["completed"], bool)


# AC-5: Backend exposes working todo CRUD endpoints with exact JSON contracts.
def test_post_todo_creates_todo_and_returns_201(client):
    resp = client.post("/api/todos", json={"text": "Buy milk"})
    assert resp.status_code == 201
    data = resp.json()
    assert set(data.keys()) == {"id", "text", "completed"}
    assert isinstance(data["id"], int)
    assert data["text"] == "Buy milk"
    assert data["completed"] is False


# AC-5: Backend exposes working todo CRUD endpoints with exact JSON contracts.
def test_put_todo_updates_text_and_completed(client):
    created = client.post("/api/todos", json={"text": "Old text"}).json()
    resp = client.put(
        f"/api/todos/{created['id']}",
        json={"text": "New text", "completed": True},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert set(data.keys()) == {"id", "text", "completed"}
    assert data["id"] == created["id"]
    assert data["text"] == "New text"
    assert data["completed"] is True


# AC-5: Backend exposes working todo CRUD endpoints with exact JSON contracts.
def test_delete_todo_removes_todo_and_returns_204(client):
    created = client.post("/api/todos", json={"text": "Delete me"}).json()
    resp = client.delete(f"/api/todos/{created['id']}")
    assert resp.status_code == 204
    assert resp.content == b""
    assert client.get("/api/todos").json() == [] or all(
        item["id"] != created["id"] for item in client.get("/api/todos").json()
    )


# AC-5: Invalid input and missing todo IDs return 4xx responses.
def test_post_todo_with_invalid_text_returns_422(client):
    resp = client.post("/api/todos", json={"text": ""})
    assert resp.status_code == 422


# AC-5: Invalid input and missing todo IDs return 4xx responses.
def test_put_missing_todo_returns_404(client):
    resp = client.put("/api/todos/999999", json={"text": "X", "completed": False})
    assert resp.status_code == 404


# AC-5: Invalid input and missing todo IDs return 4xx responses.
def test_delete_missing_todo_returns_404(client):
    resp = client.delete("/api/todos/999999")
    assert resp.status_code == 404
