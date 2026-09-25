from django.db import models

from apps.common.models import TimeStampedModel, UUIDModel
from apps.tenants.models import TenantScopedModel


class Permission(UUIDModel):
    """
    Global, fixed catalog (not tenant-scoped) — e.g. "students.view". Seeded
    by `python manage.py seed_permissions` from `apps.authorization.catalog`.
    """

    code = models.CharField(max_length=100, unique=True, db_index=True)
    name = models.CharField(max_length=150)
    module = models.CharField(max_length=50, db_index=True)
    description = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "permissions"
        ordering = ["module", "code"]

    def __str__(self):
        return self.code


class Role(TenantScopedModel, TimeStampedModel):
    """
    Tenant-scoped: each school has its own copy of roles so one school's
    customization (renaming, disabling, re-permissioning a role) never
    affects another. `is_system` roles are seeded automatically when a
    school is created (Phase 5) and are protected from deletion.
    """

    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100)
    description = models.CharField(max_length=255, blank=True)
    is_system = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    permissions = models.ManyToManyField(Permission, through="RolePermission", related_name="roles")

    class Meta:
        db_table = "roles"
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(fields=["school", "slug"], name="unique_role_slug_per_school"),
        ]

    def __str__(self):
        return self.name


class RolePermission(TenantScopedModel):
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="role_permissions")
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, related_name="role_permissions")
    granted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "role_permissions"
        constraints = [
            models.UniqueConstraint(fields=["role", "permission"], name="unique_role_permission"),
        ]

    def save(self, *args, **kwargs):
        if self.role.school_id != self.school_id:
            raise ValueError("RolePermission.school must match role.school")
        super().save(*args, **kwargs)


class UserRole(TenantScopedModel):
    user = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="user_roles")
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="user_roles")
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(
        "users.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )

    class Meta:
        db_table = "user_roles"
        constraints = [
            models.UniqueConstraint(fields=["user", "role"], name="unique_user_role"),
        ]

    def save(self, *args, **kwargs):
        if self.role.school_id != self.school_id or self.user.school_id != self.school_id:
            raise ValueError("UserRole.school must match both user.school and role.school")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user_id} -> {self.role_id}"
