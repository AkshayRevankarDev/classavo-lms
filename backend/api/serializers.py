import json

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User, Course, Chapter, Enrollment


class RoleTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Accepts either `email` or `username` for login, and adds role +
    username claims to the JWT payload so the SPA can read them."""

    username_field = "email"  # makes DRF expose an `email` input field

    def validate(self, attrs):
        from django.contrib.auth import authenticate

        login_value = attrs.get("email") or attrs.get("username") or ""
        password = attrs.get("password")

        # Try email first, fall back to username.
        user_qs = User.objects.filter(email__iexact=login_value)
        if user_qs.exists():
            username = user_qs.first().username
        else:
            username = login_value

        user = authenticate(
            request=self.context.get("request"),
            username=username,
            password=password,
        )
        if user is None or not user.is_active:
            raise serializers.ValidationError(
                {"detail": "No active account found with the given credentials"}
            )

        refresh = self.get_token(user)
        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "role": user.role,
            "username": user.username,
        }

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["username"] = user.username
        return token


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "role")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "role")

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


# ---------------------------------------------------------------------------
# Chapter
# ---------------------------------------------------------------------------


class ChapterSerializer(serializers.ModelSerializer):
    """API shape used by the SPA: `visibility` instead of `is_public`,
    `content` accepted as JSON or as a JSON-encoded string."""

    class Meta:
        model = Chapter
        fields = (
            "id",
            "course",
            "title",
            "content",
            "is_public",
            "order",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["visibility"] = "public" if instance.is_public else "private"
        return data

    def to_internal_value(self, data):
        data = dict(data)
        if "visibility" in data:
            data["is_public"] = data.pop("visibility") == "public"
        if "content" in data and isinstance(data["content"], str):
            raw = data["content"]
            try:
                data["content"] = json.loads(raw)
            except (TypeError, ValueError):
                # Fall back to wrapping a plain string in a Plate-style node.
                data["content"] = [
                    {"type": "p", "children": [{"text": raw}]}
                ]
        return super().to_internal_value(data)


class ChapterListSerializer(ChapterSerializer):
    class Meta(ChapterSerializer.Meta):
        fields = ("id", "course", "title", "is_public", "order", "updated_at")


# ---------------------------------------------------------------------------
# Course
# ---------------------------------------------------------------------------


class CourseInstructorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username")


class CourseSerializer(serializers.ModelSerializer):
    """SPA shape: `name` (== model.title), nested `instructor` object."""

    name = serializers.CharField(source="title")
    instructor = CourseInstructorSerializer(read_only=True)

    class Meta:
        model = Course
        fields = ("id", "name", "description", "instructor", "created_at")
        read_only_fields = ("created_at",)
