from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        INSTRUCTOR = "instructor", "Instructor"
        STUDENT = "student", "Student"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)

    @property
    def is_instructor(self) -> bool:
        return self.role == self.Role.INSTRUCTOR

    @property
    def is_student(self) -> bool:
        return self.role == self.Role.STUDENT


class Course(models.Model):
    instructor = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="courses_taught"
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.title


class Chapter(models.Model):
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="chapters"
    )
    title = models.CharField(max_length=200)
    # Plate.js stores a JSON document (array of nodes)
    content = models.JSONField(default=list, blank=True)
    is_public = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self) -> str:
        return f"{self.course.title} — {self.title}"


class Enrollment(models.Model):
    student = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="enrollments"
    )
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="enrollments"
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "course")


class ChapterProgress(models.Model):
    """A row exists iff the student has marked the chapter as read/complete."""

    student = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="chapter_progress"
    )
    chapter = models.ForeignKey(
        Chapter, on_delete=models.CASCADE, related_name="completions"
    )
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("student", "chapter")
