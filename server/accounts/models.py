from django.db import models
import  uuid
from django.contrib.auth.models import (AbstractBaseUser,PermissionsMixin)
from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True,default=uuid.uuid7,editable=False)
    username=models.CharField(max_length=250,unique=True,db_index=True)
    email = models.EmailField(null=True,blank=True,db_index=True)
    name = models.CharField(max_length=150,blank=True)
    is_superuser = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    objects = UserManager()

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = []
    class Meta:
        db_table = "users"
        constraints=[
            models.UniqueConstraint(
                fields=["email"],
                condition=models.Q(email__isnull=False),
                name="unique_user_email_if_not_null"
            )
        ]
    def __str__(self):
        return self.username


class CliToken(models.Model):
    id = models.UUIDField( primary_key=True, default=uuid.uuid7, editable=False )
    token = models.CharField(max_length=100, unique=True)
    user=models.ForeignKey(User,on_delete=models.CASCADE)
    name = models.CharField(max_length=150)
    description = models.CharField(max_length=150,blank=True)
    created_at= models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)
    expires_at=models.DateTimeField(null=True,blank=True)
    is_active = models.BooleanField(default=True)
