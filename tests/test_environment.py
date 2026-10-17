import sys


def test_python_version_supported():
    assert sys.version_info >= (3, 11)


def test_core_dependencies_importable():
    import fastapi
    import pydantic
    import uvicorn

    assert fastapi is not None
    assert pydantic is not None
    assert uvicorn is not None
