"""API routes.

The submitted text is treated as untrusted. It is validated and normalized
before analysis. Submitted content is never logged.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.config import MAX_INPUT_LENGTH
from app.explanations import Explanation, explain
from app.models import ScamCaseFile
from app.router import build_case_file
from app.validation import InputValidationError, normalize_input

router = APIRouter(prefix="/api")


class AnalyzeRequest(BaseModel):
    text: str = Field(min_length=1, max_length=MAX_INPUT_LENGTH)


class AnalyzeResponse(BaseModel):
    case_file: ScamCaseFile
    explanation: Explanation


class HealthResponse(BaseModel):
    status: str


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    try:
        normalized = normalize_input(request.text)
    except InputValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    case_file = build_case_file(normalized)
    return AnalyzeResponse(case_file=case_file, explanation=explain(case_file))
