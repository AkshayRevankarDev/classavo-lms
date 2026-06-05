from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .serializers import RoleTokenObtainPairSerializer
from .views import (
    ChapterCompleteView,
    CourseChapterDetailView,
    CourseChaptersView,
    CourseProgressView,
    CourseStudentsView,
    CourseViewSet,
    EnrollView,
    LeaveCourseView,
    MeView,
    MyEnrollmentsView,
    RegisterView,
)


class RoleTokenObtainPairView(TokenObtainPairView):
    serializer_class = RoleTokenObtainPairSerializer


router = DefaultRouter()
router.register(r"courses", CourseViewSet, basename="course")

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", RoleTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", MeView.as_view(), name="me"),

    # Nested chapter routes
    path("courses/<int:course_id>/chapters/", CourseChaptersView.as_view()),
    path(
        "courses/<int:course_id>/chapters/<int:chapter_id>/",
        CourseChapterDetailView.as_view(),
    ),
    path(
        "courses/<int:course_id>/chapters/<int:chapter_id>/complete/",
        ChapterCompleteView.as_view(),
    ),

    # Enrollment + progress + roster
    path("courses/<int:course_id>/enroll/", EnrollView.as_view()),
    path("courses/<int:course_id>/leave/", LeaveCourseView.as_view()),
    path("courses/<int:course_id>/progress/", CourseProgressView.as_view()),
    path("courses/<int:course_id>/students/", CourseStudentsView.as_view()),
    path("my-enrollments/", MyEnrollmentsView.as_view()),

    path("", include(router.urls)),
]
