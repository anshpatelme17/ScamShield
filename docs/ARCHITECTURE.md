# Architecture

Status: `NOT_STARTED` (design captured below; implementation begins in Phase 2).

## Intended flow

```
User Input
    -> Validation and Normalization
    -> Input Classification and Indicator Extraction
    -> Small Analysis Router
    -> Relevant Local Analyzers
    -> Structured Evidence Findings
    -> Scam Case File
    -> Deterministic Verdict Policy
    -> Explanation and Action Recommendations
    -> Frontend Results
```

## Principles

- Small, understandable architecture. No complex orchestration engine.
- Each analyzer is an independent module that returns structured `Finding` objects.
- Evidence is data; the verdict is a deterministic policy over that data.
- Core analysis is fully offline and does not depend on an external API or LLM.
- The system must never claim an input is safe merely because no indicators were found.

## Stack (subject to verification in later phases)

- Backend: Python, FastAPI, Pydantic
- Testing: pytest
- Frontend: React and Tailwind CSS (added later; requires Node.js)
- Version control: Git
