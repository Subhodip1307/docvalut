from django.contrib import admin
from .models import CliToken


@admin.register(CliToken)
class CliTokenAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "user",
        "name",
        "created_at",
        "expires_at",
        "is_active",
        "token",

    )

    list_filter = (
        "is_active",
        "created_at",
        "expires_at",
    )

    search_fields = (
        "name",
        "user__username",
    )

    readonly_fields = (
        "id",
        # "token",
        "created_at",
        "updated_at",
    )

    ordering = ("-created_at",)