from abc import ABC, abstractmethod


class BaseVideoAdapter(ABC):

    @abstractmethod
    def get_stream(self):
        """
        Return a normalized stream description.

        The response should tell the frontend:
        - stream type
        - stream format
        - URL when directly available
        - whether the browser can play it directly
        - whether a relay is required
        """
        raise NotImplementedError

    @abstractmethod
    def health_check(self):
        """
        Check whether the video source is available.
        """
        raise NotImplementedError