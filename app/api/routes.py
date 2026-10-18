"""API routes.

The submitted text and image are treated as untrusted. They are validated
and normalized before analysis. Submitted content is never logged.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, model_validator

from app.config import MAX_IMAGE_BYTES, MAX_INPUT_LENGTH
from app.explanations import Explanation, explain
from app.models import ScamCaseFile
from app.router import build_case_file
from app.validation import InputValidationError, normalize_input

router = APIRouter(prefix="/api")


class AnalyzeRequest(BaseModel):
    text: str | None = Field(default=None, max_length=MAX_INPUT_LENGTH)
    image_b64: str | None = Field(
        default=None, max_length=(MAX_IMAGE_BYTES * 4 + 3) // 3 + 8
    )

    @model_validator(mode="after")
    def _require_at_least_one_source(self) -> AnalyzeRequest:
        if self.text is None and self.image_b64 is None:
            raise ValueError("provide text and/or image_b64")
        return self


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
    normalized = None
    if request.text is not None:
        try:
            normalized = normalize_input(request.text)
        except InputValidationError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
    try:
        case_file = build_case_file(normalized, image_b64=request.image_b64)
    except InputValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return AnalyzeResponse(case_file=case_file, explanation=explain(case_file))
