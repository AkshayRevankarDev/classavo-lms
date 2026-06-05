from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Chapter, ChapterProgress, Course, Enrollment, User
from .serializers import (
    ChapterListSerializer,
    ChapterSerializer,
    CourseSerializer,
    RegisterSerializer,
    UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class CourseViewSet(viewsets.ModelViewSet):
    """CRUD for courses.

    * Instructors listing `/courses/` see only the courses they own.
    * Students listing `/courses/` see the full catalogue (for browsing).
    * `retrieve`, `update` and `destroy` still resolve any course by id;
      object-level checks below enforce ownership for writes, and the
      chapter detail view enforces public/private for reads.
    """

    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = (
            Course.objects.select_related("instructor")
            .all()
            .order_by("-created_at")
        )
        user = self.request.user
        if (
            self.action == "list"
            and user
            and user.is_authenticated
            and user.is_instructor
        ):
            qs = qs.filter(instructor=user)
        return qs

    def perform_create(self, serializer):
        if not self.request.user.is_instructor:
            raise PermissionDenied("Only instructors can create courses.")
        serializer.save(instructor=self.request.user)

    def update(self, request, *args, **kwargs):
        course = self.get_object()
        if course.instructor_id != request.user.id:
            raise PermissionDenied("You can only edit your own courses.")
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        course = self.get_object()
        if course.instructor_id != request.user.id:
            raise PermissionDenied("You can only delete your own courses.")
        return super().destroy(request, *args, **kwargs)


# ---------------------------------------------------------------------------
# Nested chapter endpoints
# ---------------------------------------------------------------------------


def _chapters_visible_to(user, course):
    qs = course.chapters.all()
    if course.instructor_id == user.id:
        return qs
    return qs.filter(is_public=True)


class CourseChaptersView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id)
        chapters = _chapters_visible_to(request.user, course).order_by("order", "id")
        return Response(ChapterListSerializer(chapters, many=True).data)

    def post(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id)
        if course.instructor_id != request.user.id:
            raise PermissionDenied("Only the course's instructor can add chapters.")
        data = dict(request.data)
        data["course"] = course.id
        if "content" not in data:
            data["content"] = [{"type": "p", "children": [{"text": ""}]}]
        if "order" not in data:
            data["order"] = course.chapters.count()
        if "visibility" not in data and "is_public" not in data:
            data["visibility"] = "private"
        serializer = ChapterSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CourseChapterDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _get(self, course_id, chapter_id):
        return get_object_or_404(Chapter, pk=chapter_id, course_id=course_id)

    def get(self, request, course_id, chapter_id):
        chapter = self._get(course_id, chapter_id)
        is_owner = chapter.course.instructor_id == request.user.id
        if not chapter.is_public and not is_owner:
            raise PermissionDenied("This chapter is private.")
        data = ChapterSerializer(chapter).data
        if not is_owner:
            data["completed"] = ChapterProgress.objects.filter(
                student=request.user, chapter=chapter
            ).exists()
        return Response(data)

    def patch(self, request, course_id, chapter_id):
        chapter = self._get(course_id, chapter_id)
        if chapter.course.instructor_id != request.user.id:
            raise PermissionDenied("Only the course's instructor can edit chapters.")
        serializer = ChapterSerializer(chapter, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def put(self, request, course_id, chapter_id):
        return self.patch(request, course_id, chapter_id)

    def delete(self, request, course_id, chapter_id):
        chapter = self._get(course_id, chapter_id)
        if chapter.course.instructor_id != request.user.id:
            raise PermissionDenied("Only the course's instructor can delete chapters.")
        chapter.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Enrollment + leave
# ---------------------------------------------------------------------------


class EnrollView(APIView):
    """POST /courses/{course_id}/enroll/"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id)
        if request.user.is_instructor:
            return Response(
                {"detail": "Instructors cannot enroll."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        enrollment, _ = Enrollment.objects.get_or_create(
            student=request.user, course=course
        )
        return Response(
            {"id": enrollment.id, "course": course.id, "detail": "Enrolled."},
            status=status.HTTP_200_OK,
        )


class LeaveCourseView(APIView):
    """POST /courses/{course_id}/leave/  — unenroll and drop progress."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id)
        deleted, _ = Enrollment.objects.filter(
            student=request.user, course=course
        ).delete()
        # Also clear progress on this course's chapters
        ChapterProgress.objects.filter(
            student=request.user, chapter__course=course
        ).delete()
        return Response(
            {"detail": "Left course." if deleted else "Was not enrolled."},
            status=status.HTTP_200_OK,
        )


class MyEnrollmentsView(APIView):
    """GET /my-enrollments/ — enrolled courses with progress summary."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        rows = (
            Enrollment.objects.filter(student=request.user)
            .select_related("course")
            .order_by("-joined_at")
        )
        out = []
        for r in rows:
            total = r.course.chapters.filter(is_public=True).count()
            completed = ChapterProgress.objects.filter(
                student=request.user, chapter__course=r.course, chapter__is_public=True
            ).count()
            out.append(
                {
                    "id": r.id,
                    "course": r.course_id,
                    "joined_at": r.joined_at,
                    "progress": {
                        "completed": completed,
                        "total": total,
                        "percent": int(round(100 * completed / total)) if total else 0,
                    },
                }
            )
        return Response(out)


# ---------------------------------------------------------------------------
# Progress + roster
# ---------------------------------------------------------------------------


class CourseProgressView(APIView):
    """GET /courses/{course_id}/progress/ — current student's progress."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id)
        public_chapters = course.chapters.filter(is_public=True)
        total = public_chapters.count()
        completed_ids = list(
            ChapterProgress.objects.filter(
                student=request.user, chapter__in=public_chapters
            ).values_list("chapter_id", flat=True)
        )
        return Response(
            {
                "completed_chapter_ids": completed_ids,
                "completed": len(completed_ids),
                "total": total,
                "percent": int(round(100 * len(completed_ids) / total)) if total else 0,
            }
        )


class ChapterCompleteView(APIView):
    """POST /courses/{course_id}/chapters/{chapter_id}/complete/

    DELETE same path to unmark."""

    permission_classes = [permissions.IsAuthenticated]

    def _chapter(self, course_id, chapter_id):
        return get_object_or_404(Chapter, pk=chapter_id, course_id=course_id)

    def post(self, request, course_id, chapter_id):
        chapter = self._chapter(course_id, chapter_id)
        if not chapter.is_public:
            raise PermissionDenied("Cannot complete a private chapter.")
        ChapterProgress.objects.get_or_create(
            student=request.user, chapter=chapter
        )
        return Response({"detail": "Marked complete."}, status=status.HTTP_200_OK)

    def delete(self, request, course_id, chapter_id):
        chapter = self._chapter(course_id, chapter_id)
        ChapterProgress.objects.filter(
            student=request.user, chapter=chapter
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CourseStudentsView(APIView):
    """GET /courses/{course_id}/students/ — instructor only."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id)
        if course.instructor_id != request.user.id:
            raise PermissionDenied("Only the course's instructor can view the roster.")
        rows = (
            Enrollment.objects.filter(course=course)
            .select_related("student")
            .order_by("joined_at")
        )
        total_public = course.chapters.filter(is_public=True).count()
        out = []
        for r in rows:
            completed = ChapterProgress.objects.filter(
                student=r.student,
                chapter__course=course,
                chapter__is_public=True,
            ).count()
            out.append(
                {
                    "id": r.id,
                    "student": {
                        "id": r.student.id,
                        "username": r.student.username,
                        "email": r.student.email,
                    },
                    "joined_at": r.joined_at,
                    "progress": {
                        "completed": completed,
                        "total": total_public,
                        "percent": int(round(100 * completed / total_public))
                        if total_public
                        else 0,
                    },
                }
            )
        return Response(out)
