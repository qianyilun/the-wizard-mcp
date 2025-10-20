# Repository Guidelines

## Project Structure & Module Organization
- `src/mcp_feedback_enhanced/` hosts the Python MCP server; keep shared helpers in `utils/` and feature modules grouped by domain.
- `src-tauri/` houses the desktop wrapper (Rust in `src-tauri/src/`, static assets in `icons/` and `python/` glue).
- Tests live in `tests/` with `unit/`, `integration/`, `helpers/`, and fixture data in `fixtures/`.
- Refer to `docs/` for UI assets and `examples/` for ready-to-use MCP configs.

## Build, Test, and Development Commands
- `make dev-setup` installs dev dependencies with `uv` and registers pre-commit hooks.
- `make check` runs Ruff linting/format checks plus `mypy`.
- `make test` runs the full `pytest` suite; use `make test-fast` to skip `slow` tests and `make test-cov` for HTML coverage in `htmlcov/`.
- `make build-desktop` (or `make build-desktop-release`) drives `scripts/build_desktop.py` to compile the Tauri app.

## Coding Style & Naming Conventions
- Target Python 3.11, 4-space indentation, 88-character lines, and double quotes—`make format` applies the Ruff formatter.
- Keep imports sorted by Ruff's isort rules; use `snake_case` for functions, `PascalCase` for classes, and ALL_CAPS for constants.
- Add type hints and let `make type-check` pass before review; prefer logging helpers over ad-hoc `print`.
- Localized strings belong in `src/mcp_feedback_enhanced/i18n/`; mirror that layout when adding locales.

## Testing Guidelines
- Name tests `test_*.py` as enforced by `pytest.ini`; place unit coverage in `tests/unit/` and multi-service flows in `tests/integration/`.
- Mark slow scenarios with `@pytest.mark.slow` so they stay gated behind `make test`.
- Share reusable setup via `tests/fixtures/` and `tests/helpers/`; avoid duplicating mock clients.
- Maintain coverage trends; highlight any expected drops in the PR description.

## Commit & Pull Request Guidelines
- Follow the prevailing history: optional emoji + succinct prefix (e.g. `Doc:`, `Fix:`) with an imperative summary under ~72 characters.
- Reference issues with `#123`, update `RELEASE_NOTES` when behaviour changes, and include screenshots for UI-facing work.
- PRs should list the commands you ran (`make check`, `make test`, etc.) and pass `make pre-commit-run` before requesting review.

## Configuration Tips
- Sample MCP setups live in `examples/mcp-config-*.json`; use them when documenting new env vars such as `MCP_WEB_HOST` or `MCP_DESKTOP_MODE`.
- For remote runtimes, call out any non-default ports in your PR notes so reviewers can reproduce the flow.
