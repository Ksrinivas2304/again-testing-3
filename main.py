from contextlib import asynccontextmanager
import os
from typing import Generator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Boolean, Integer, String, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

# API CONTRACT
# GET  /api/todos
#   response: [{"id": int, "title": str, "completed": bool}]
# POST /api/todos
#   request: {"title": str}
#   response: {"id": int, "title": str, "completed": bool}
# PATCH /api/todos/{id}
#   request: {"title": str | omitted, "completed": bool | omitted}
#   response: {"id": int, "title": str, "completed": bool}
# DELETE /api/todos/{id}
#   response: 204 No Content

engine = create_engine(os.environ["DATABASE_URL"], pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


class Todo(Base):
    __tablename__ = "todos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class TodoOut(BaseModel):
    id: int
    title: str
    completed: bool

    model_config = ConfigDict(from_attributes=True)


class TodoCreate(BaseModel):
    title: str = Field(..., min_length=1)

    @staticmethod
    def validate_title(value: str) -> str:
        if not value or not value.strip():
            raise ValueError("title must not be blank")
        return value.strip()


class TodoPatch(BaseModel):
    title: str | None = None
    completed: bool | None = None

    @staticmethod
    def validate_title(value: str | None) -> str | None:
        if value is None:
            return None
        if not isinstance(value, str) or not value.strip():
            raise ValueError("title must not be blank")
        return value.strip()


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


@app.get("/api/todos", response_model=list[TodoOut])
async def list_todos() -> list[TodoOut]:
    with SessionLocal() as db:
        return list(db.scalars(select(Todo).order_by(Todo.id)).all())


@app.post("/api/todos", response_model=TodoOut, status_code=201)
async def create_todo(body: TodoCreate) -> TodoOut:
    title = TodoCreate.validate_title(body.title)
    if title is None:
        raise HTTPException(status_code=422, detail="title is required")
    with SessionLocal() as db:
        todo = Todo(title=title, completed=False)
        db.add(todo)
        db.commit()
        db.refresh(todo)
        return todo


@app.patch("/api/todos/{todo_id}", response_model=TodoOut)
async def patch_todo(todo_id: int, body: TodoPatch) -> TodoOut:
    if body.title is None and body.completed is None:
        raise HTTPException(status_code=422, detail="at least one field must be provided")
    title = TodoPatch.validate_title(body.title)
    with SessionLocal() as db:
        todo = db.get(Todo, todo_id)
        if todo is None:
            raise HTTPException(status_code=404, detail="todo not found")
        if body.title is not None:
            todo.title = title or ""
        if body.completed is not None:
            todo.completed = body.completed
        if body.title is not None and not todo.title.strip():
            raise HTTPException(status_code=422, detail="title must not be blank")
        db.commit()
        db.refresh(todo)
        return todo


@app.delete("/api/todos/{todo_id}", status_code=204)
async def delete_todo(todo_id: int) -> None:
    with SessionLocal() as db:
        todo = db.get(Todo, todo_id)
        if todo is None:
            raise HTTPException(status_code=404, detail="todo not found")
        db.delete(todo)
        db.commit()
