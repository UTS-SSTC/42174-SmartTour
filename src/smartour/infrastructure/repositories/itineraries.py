"""Itinerary repository implementations."""

from smartour.domain.itinerary import Itinerary


class InMemoryItineraryRepository:
    """
    Process-local in-memory itinerary repository.
    """

    def __init__(self) -> None:
        """
        Initialize the repository.
        """
        self.itineraries: dict[str, Itinerary] = {}

    def save(self, itinerary: Itinerary) -> None:
        """
        Save an itinerary.

        Args:
            itinerary: The itinerary to save.
        """
        self.itineraries[itinerary.id] = itinerary.model_copy(deep=True)

    def get(self, itinerary_id: str) -> Itinerary | None:
        """
        Return an itinerary by ID.

        Args:
            itinerary_id: The itinerary ID.

        Returns:
            The itinerary when found.
        """
        itinerary = self.itineraries.get(itinerary_id)
        if itinerary is None:
            return None
        return itinerary.model_copy(deep=True)
