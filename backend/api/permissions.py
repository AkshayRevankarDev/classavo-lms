from rest_framework import permissions


class IsInstructor(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_instructor
        )


class IsCourseInstructorOrReadOnly(permissions.BasePermission):
    """Read for any authenticated user; write only for the course's instructor.

    Custom actions (join/leave) are allowed for any authenticated user and
    perform their own role checks inside the viewset.
    """

    ALLOWED_ACTIONS = {"join", "leave"}

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if getattr(view, "action", None) in self.ALLOWED_ACTIONS:
            return True
        return obj.instructor_id == request.user.id


class IsChapterCourseInstructorOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.course.instructor_id == request.user.id
