# Backward compatibility - import app from modularized structure
# This allows `uvicorn analyse:app --reload` to continue working
from server import app

# All functionality is now in the modularized structure:
# - config/ (database, gemini, ml_models)
# - services/ (classification, description, activity)
# - routes/ (analysis, data, health)
# - utils/ (preprocessing, serializers)
# - middleware/ (cors)
# - server.py (main FastAPI app)
