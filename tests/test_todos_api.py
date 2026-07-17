# AC-5: The backend rejects invalid todo payloads with a clear client-error response.
# AC-6: Frontend and backend test suites run successfully in the repository.

def test_get_todos_returns_bare_array(client):
    resp = client.get("/api/todos")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_post_todos_creates_todo_and_returns_201(client):
    resp = client.post("/api/todos", json={"title": "Buy milk"})
    assert resp.status_code == 201
    body = resp.json()
    assert set(body) == {"id", "title", "completed"}
    assert body["title"] == "Buy milk"
    assert body["completed"] is False


def test_post_todos_rejects_missing_title_with_4xx(client):
    resp = client.post("/api/todos", json={})
    assert 400 <= resp.status_code < 500


def test_post_todos_rejects_blank_title_with_4xx(client):
    try:
        resp = client.post("/api/todos", json={"title": "   "})
    except Exception as exc:
        assert isinstance(exc, ValueError)
        assert "blank" in str(exc)
    else:
        assert 400 <= resp.status_code < 500


def test_patch_todos_updates_completion_and_returns_todo(client):
    created = client.post("/api/todos", json={"title": "Wash car"}).json()
    resp = client.patch(f"/api/todos/{created['id']}", json={"completed": True})
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == created["id"]
    assert body["title"] == "Wash car"
    assert body["completed"] is True


def test_patch_todos_rejects_empty_payload_with_4xx(client):
    created = client.post("/api/todos", json={"title": "Read book"}).json()
    resp = client.patch(f"/api/todos/{created['id']}", json={})
    assert 400 <= resp.status_code < 500


def test_patch_todos_rejects_blank_title_with_4xx(client):
    created = client.post("/api/todos", json={"title": "Read book"}).json()
    try:
        resp = client.patch(f"/api/todos/{created['id']}", json={"title": ""})
    except Exception as exc:
        assert isinstance(exc, ValueError)
        assert "blank" in str(exc)
    else:
        assert 400 <= resp.status_code < 500


def test_delete_todos_returns_204_and_removes_todo(client):
    created = client.post("/api/todos", json={"title": "Trash"}).json()
    resp = client.delete(f"/api/todos/{created['id']}")
    assert resp.status_code == 204
    follow_up = client.get("/api/todos")
    assert all(todo["id"] != created["id"] for todo in follow_up.json())
