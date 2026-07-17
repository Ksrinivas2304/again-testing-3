"""Shared pytest fixtures for API contract tests."""
import os
import sys

_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, _root)

os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

import pytest
from starlette.testclient import TestClient

import main


@pytest.fixture
def client():
    with TestClient(main.app) as c:
        yield c
