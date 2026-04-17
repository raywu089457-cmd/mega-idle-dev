---
name: API Layer Eval
type: regression
layer: api
file: tests/api/
---

# [REGRESSION EVAL: api-layer]

## Baseline
Current deployed: https://mega-idle-dev.onrender.com

## Tests

| Endpoint | Method | Expectation |
|----------|--------|-------------|
| `/api/user` | GET | 200 + user object (auth) / 401 (no auth) |
| `/api/heroes` | GET | 200 + heroes array (auth) |
| `/api/heroes` | POST | 200 + result or structured error |
| `/api/heroes/train` | POST | 200 + hero / 400 bad request |
| `/api/dispatch` | POST | 200 + updated heroes |
| `/api/build` | GET | 200 + buildings state |
| `/api/build` | POST | 200 + build result or 400 |
| `/api/zones` | GET | 200 + zones array |
| `/api/logs` | GET | 200 + logs array |
| `/api/events` | GET | SSE stream starts with `data:` |

## Pass Criteria
All endpoints return documented status codes.
No 500 errors on valid authenticated requests.

## Grader
Code-based (Playwright APIRequestContext with session cookie injection).

## pass@k Target
pass@1 ≥ 0.95 (stable HTTP contracts)
