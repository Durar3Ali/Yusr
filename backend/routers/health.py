from fastapi import APIRouter

router = APIRouter()


@router.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Readwell-Aid backend is running"}
