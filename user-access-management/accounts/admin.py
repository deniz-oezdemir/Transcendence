from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
# from .forms import CustomUserCreationForm, CustomUserChangeForm
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    # add_form = CustomUserCreationForm
    # form = CustomUserChangeForm
    model = CustomUser
    list_display = [
    "username",
    "email",
    "avatar_url",
    "date_joined",
    "status",
    "last_login",
    # "user_permissions",
    "is_active",
    "is_staff",
    "is_superuser",
    ]
    # fieldsets = UserAdmin.fieldsets + ((None, {"fields": ("age",)}),) #to edit new custom fields in the admin panel
    # add_fieldsets = UserAdmin.add_fieldsets + ((None, {"fields": ("age",)}),) #to include new custom fields in the section for creating a new user in the admin panel
admin.site.register(CustomUser, CustomUserAdmin)