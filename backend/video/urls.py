from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import VideoSourceViewSet


router = DefaultRouter()

router.register(
    "",
    VideoSourceViewSet,
    basename="video-source",
)


urlpatterns = [
    path(
        "",
        include(router.urls),
    ),
]