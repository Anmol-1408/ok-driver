from rest_framework.permissions import BasePermission


class IsAdminUserRole(BasePermission):
    message = "Only administrators can manage cameras."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_superuser
                or request.user.role == "ADMIN"
            )
        )