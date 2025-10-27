from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request, Depends, Query
from bson import ObjectId

from users.auth import get_current_user_claims, require_admin
from .models import SuggestionIn, SuggestionOut

router = APIRouter()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.post("/suggestions", response_model=SuggestionOut)
async def create_suggestion(payload: SuggestionIn, request: Request):
    """Allow any authenticated user to suggest a book.
    Marks the suggestion with notify_admins=True and needs_review=True so that
    admin tools can surface it. Admins may later acknowledge it.
    """
    db = request.app.state.db
    # Ensure the user is authenticated
    claims = get_current_user_claims(request)

    doc = payload.dict()
    doc.update({
        "submitter_id": str(claims.get("sub") or claims.get("user_id") or ""),
        "submitter_username": claims.get("username"),
        "created_at": _now_iso(),
        "notify_admins": True,
        "needs_review": True,
        "acknowledged": False,
        "acknowledged_by": None,
        "acknowledged_at": None,
    })

    res = await db.suggestions.insert_one(doc)
    if not res.acknowledged:
        raise HTTPException(status_code=500, detail="Failed to create suggestion")

    return SuggestionOut(id=str(res.inserted_id), **doc)


@router.get("/suggestions", response_model=List[SuggestionOut])
async def list_suggestions(request: Request, only_needing_review: bool = Query(False), _: bool = Depends(require_admin)):
    """Admin-only: list suggestions. Optionally filter to those needing review."""
    db = request.app.state.db
    query = {"needs_review": True} if only_needing_review else {}

    items: List[SuggestionOut] = []
    async for doc in db.suggestions.find(query).sort("created_at", -1):
        doc["id"] = str(doc["_id"])  # serialize
        doc.pop("_id", None)
        try:
            items.append(SuggestionOut(**doc))
        except Exception:
            # Skip malformed entries instead of failing the entire request
            continue
    return items


@router.get("/suggestions/mine", response_model=List[SuggestionOut])
async def list_my_suggestions(request: Request):
    """List suggestions created by the current authenticated user."""
    db = request.app.state.db
    claims = get_current_user_claims(request)
    submitter_id = str(claims.get("sub") or claims.get("user_id") or "")
    items: List[SuggestionOut] = []
    async for doc in db.suggestions.find({"submitter_id": submitter_id}).sort("created_at", -1):
        doc["id"] = str(doc["_id"])  # serialize
        doc.pop("_id", None)
        try:
            items.append(SuggestionOut(**doc))
        except Exception:
            continue
    return items


@router.put("/suggestions/{suggestion_id}/acknowledge", response_model=SuggestionOut)
async def acknowledge_suggestion(suggestion_id: str, request: Request, _: bool = Depends(require_admin)):
    """Admin-only: mark a suggestion as acknowledged. Clears needs_review and notify_admins."""
    db = request.app.state.db
    try:
        doc = await db.suggestions.find_one({"_id": ObjectId(suggestion_id)})
    except Exception:
        doc = None
    if not doc:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    claims = get_current_user_claims(request)
    updates = {
        "acknowledged": True,
        "needs_review": False,
        "notify_admins": False,
        "acknowledged_by": claims.get("username") or str(claims.get("sub") or "admin"),
        "acknowledged_at": _now_iso(),
    }

    res = await db.suggestions.update_one({"_id": ObjectId(suggestion_id)}, {"$set": updates})
    if not res.acknowledged:
        raise HTTPException(status_code=500, detail="Failed to update suggestion")

    updated = await db.suggestions.find_one({"_id": ObjectId(suggestion_id)})
    updated["id"] = str(updated["_id"])  # serialize
    updated.pop("_id", None)
    return SuggestionOut(**updated)
