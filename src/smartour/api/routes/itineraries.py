"""Itinerary API routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from smartour.api.dependencies import get_google_maps_client, get_planning_service
from smartour.application.planning_service import PlanningService
from smartour.core.errors import ExternalServiceError, PlanningInputError
from smartour.domain.itinerary import Itinerary
from smartour.integrations.google_maps.client import GoogleMapsClient

router = APIRouter(tags=["itineraries"])


@router.post(
    "/conversations/{conversation_id}/itinerary",
    response_model=Itinerary,
    status_code=status.HTTP_201_CREATED,
)
async def generate_itinerary(
    conversation_id: str,
    planning_service: Annotated[PlanningService, Depends(get_planning_service)],
    google_maps_client: Annotated[GoogleMapsClient, Depends(get_google_maps_client)],
) -> Itinerary:
    """
    Generate an itinerary for a confirmed conversation.

    Args:
        conversation_id: The source conversation ID.
        planning_service: The itinerary planning service.
        google_maps_client: The Google Maps client group.

    Returns:
        The generated itinerary.
    """
    try:
        itinerary = await planning_service.generate_for_conversation(
            conversation_id, google_maps_client
        )
    except PlanningInputError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(error)
        ) from error
    except ExternalServiceError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(error)
        ) from error
    if itinerary is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
        )
    return itinerary


@router.get("/itineraries/{itinerary_id}", response_model=Itinerary)
async def get_itinerary(
    itinerary_id: str,
    planning_service: Annotated[PlanningService, Depends(get_planning_service)],
) -> Itinerary:
    """
    Return a generated itinerary by ID.

    Args:
        itinerary_id: The itinerary ID.
        planning_service: The itinerary planning service.

    Returns:
        The generated itinerary.
    """
    itinerary = planning_service.get_itinerary(itinerary_id)
    if itinerary is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Itinerary not found"
        )
    return itinerary
