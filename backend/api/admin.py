from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Course, Chapter, Enrollment


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (("Role", {"fields": ("role",)}),)
    list_display = ("username", "email", "role", "is_staff")


admin.site.register(Course)
admin.site.register(Chapter)
admin.site.register(Enrollment)
