from django.contrib.auth.forms import BaseUserCreationForm
from django.contrib.auth.forms import UserChangeForm as DjangoUserChangeForm

from .models import User


class UserCreationForm(BaseUserCreationForm):
    class Meta:
        model = User
        fields = ("email", "full_name")


class UserChangeForm(DjangoUserChangeForm):
    class Meta:
        model = User
        fields = "__all__"