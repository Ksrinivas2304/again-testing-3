# API CONTRACT
# GET /api/todos
#   response: [
#     {"id": int, "text": str, "completed": bool}, ...
#   ]
# POST /api/todos
#   request: {"text": str}
#   response: 201 {"id": int, "text": str, "completed": bool}
# PUT /api/todos/{id}
#   request: {"text": str, "completed": bool}
#   response: {"id": int, "text": str, "completed": bool}
# DELETE /api/todos/{id}
#   response: 204 no body

from contextlib import asynccontextmanager
import os
from typing import Generator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Boolean, Integer, String, create_engine
from sqlalchemy.exc import IntegrityError, NoResultFound
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./todos.db")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class Todo(Base):
    __tablename__ = "todos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    text: Mapped[str] = mapped_column(String(500), nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class TodoCreate(BaseModel):
    text: str = Field(min_length=1, max_length=500)


class TodoUpdate(BaseModel):
    text: str = Field(min_length=1, max_length=500)
    completed: bool


class TodoOut(BaseModel):
    id: int
    text: str
    completed: bool

    model_config = ConfigDict(from_attributes=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@app.get("/api/todos", response_model=list[TodoOut])
async def list_todos() -> list[TodoOut]:
    with SessionLocal() as db:
        todos = db.query(Todo).order_by(Todo.id.asc()).all()
        return todos


@app.post("/api/todos", response_model=TodoOut, status_code=201)
async def create_todo(body: TodoCreate) -> TodoOut:
    with SessionLocal() as db:
        todo = Todo(text=body.text.strip(), completed=False)
        db.add(todo)
        try:
            db.commit()
            db.refresh(todo)
        except IntegrityError as exc:
            db.rollback()
            raise ValueError("failed to create todo") from exc
        return todo


@app.put("/api/todos/{todo_id}", response_model=TodoOut)
async def update_todo(todo_id: int, body: TodoUpdate) -> TodoOut:
    with SessionLocal() as db:
        todo = db.get(Todo, todo_id)
        if todo is None:
            raise NoResultFound
        todo.text = body.text.strip()
        todo.completed = body.completed
        db.add(todo)
        db.commit()
        db.refresh(todo)
        return todo


@app.delete("/api/todos/{todo_id}", status_code=204)
async def delete_todo(todo_id: int) -> None:
    with SessionLocal() as db:
        todo = db.get(Todo, todo_id)
        if todo is None:
            raise NoResultFound
        db.delete(todo)
        db.commit()
        return None


@app.exception_handler(ValueError)
async def value_error_handler(_, exc: ValueError):
    from fastapi import HTTPException

    raise HTTPException(status_code=400, detail=str(exc))


@app.exception_handler(NoResultFound)
async def not_found_handler(_, exc: NoResultFound):
    from fastapi.responses import JSONResponse

    return JSONResponse(status_code=404, content={"detail": "todo not found"})
