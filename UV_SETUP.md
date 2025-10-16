# ⚡ Backend Setup with `uv` - Fast Python Package Manager

`uv` is a fast Python package installer written in Rust. It's **10-100x faster** than pip!

## Prerequisites

- ✅ `uv` is already installed: `uv 0.8.22`
- ✅ Python 3.12.3+
- ✅ All packages installed in virtual environment

## Quick Start

### Step 1: Navigate to Backend

```bash
cd apps/api
```

### Step 2: Verify Installation

```bash
# Check uv version
uv --version

# List installed packages
uv pip list

# Verify critical packages
uv run python3 -c "
import fastapi, sqlalchemy, pydantic, openai, elevenlabs, agent_framework
print('✅ All packages installed!')
"
```

### Step 3: Activate Virtual Environment (Optional)

```bash
# Create/activate venv if using system Python
source .venv/bin/activate

# Or use uv run directly (recommended)
uv run <command>
```

### Step 4: Start Backend Server

```bash
# Option 1: Using uv run (recommended)
uv run uvicorn src.main:app --reload

# Option 2: Activate venv first
source .venv/bin/activate
uvicorn src.main:app --reload
```

Server will start at `http://localhost:8000`

---

## Common Commands

### Run Commands

```bash
# Run with uv (no activation needed)
uv run python3 src/main.py
uv run pytest src/__tests__/ -v
uv run python3 -m black src/

# Or activate venv manually
source .venv/bin/activate
python3 src/main.py
pytest src/__tests__/ -v
black src/
```

### Add/Update Dependencies

```bash
# Add a new package
uv pip install package-name

# Add to requirements.txt first, then sync
uv pip install -r requirements.txt

# Sync all packages (clean install)
uv pip sync requirements.txt
```

### Development Workflow

```bash
# Run linter
uv run flake8 src/

# Type checking
uv run mypy src/

# Format code
uv run black src/
uv run isort src/

# Run tests
uv run pytest src/__tests__/ -v --cov=src

# All together
uv run bash -c "black src/ && isort src/ && flake8 src/ && mypy src/ && pytest src/__tests__/ -v"
```

---

## Current Environment Status

### ✅ Installed Packages

**Core Framework:**
- fastapi 0.115.0+
- uvicorn 0.37.0
- sqlalchemy 2.0.44
- pydantic 2.11.4
- asyncpg 0.30.0

**Voice Services (Story 1.6):**
- ✅ agent-framework 1.0.0b251007
- ✅ openai >= 1.3.0
- ✅ azure-identity >= 1.13.0
- ✅ elevenlabs >= 0.2.0

**Database:**
- redis 6.4.0
- aioredis 2.0.1

**Testing:**
- pytest 7.4.3+
- pytest-asyncio 1.2.0
- pytest-cov 7.0.0

**Code Quality:**
- black 23.12.0+
- flake8 6.1.0+
- mypy 1.7.1+
- isort 5.13.2+

### Virtual Environments

Two environments available:
- `.venv/` - uv-created environment
- `venv/` - Original pip-created environment

(Using `.venv/` for consistency)

---

## Troubleshooting

### "command not found: uv"

```bash
# Install uv (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### "ModuleNotFoundError" when running directly

Use `uv run` prefix:

```bash
# ❌ Wrong (uses system Python)
python3 -c "import fastapi"

# ✅ Correct (uses venv)
uv run python3 -c "import fastapi"
```

### "pip install fails"

Use uv instead:

```bash
# ❌ Old way
pip install package-name

# ✅ New way
uv pip install package-name
```

### Virtual environment issues

```bash
# Remove old environment
rm -rf venv .venv

# Reinstall with uv
uv pip install -r requirements.txt
```

---

## Performance Comparison

| Task | pip | uv |
|------|-----|-----|
| Fresh install | ~3-5 min | ~30-60 sec |
| Install package | ~30 sec | ~5-10 sec |
| Resolve dependencies | ~2-3 min | ~10-30 sec |

---

## Files Related to uv Setup

- **requirements.txt** - Main dependency file (flexible versions for compatibility)
- **pyproject.toml** - Alternative Python project config (for future use)
- **.venv/** - Virtual environment created by uv
- **uv.pip** - uv configuration (if needed)

---

## Next Steps

1. **Verify everything works:**
   ```bash
   uv run python3 -m pytest src/__tests__/ -v --co
   ```

2. **Start developing:**
   ```bash
   uv run uvicorn src.main:app --reload
   ```

3. **Add more dependencies:**
   ```bash
   uv pip install new-package
   # Update requirements.txt manually or use:
   # uv pip freeze > requirements.txt
   ```

---

## For More Info

- [uv Documentation](https://docs.astral.sh/uv/)
- [Python Packaging Guide](https://packaging.python.org/)
- [Project README](../../../README.md)
- [Tech Stack](../../../docs/architecture/tech-stack.md)
