from django.db import models

# Create your models here.
class Token(models.Model):
    created_at = models.DateTimeField(auto_now=True)
    token = models.CharField(max_length=127)
    expires_at = models.DateTimeField()
    account_id = models.IntegerField()
    login_ip = models.CharField(max_length=127)
    user_agent = models.TextField()

    class Meta:
        managed = False
        db_table = 'token'

USER_ADMIN_FLAG     = 1
USER_OAUTH_FLAG     = 2
USER_DELETED_FLAG   = 4
class Users(models.Model):
    username = models.CharField(unique=True, max_length=32)
    password = models.CharField(max_length=127)
    email = models.CharField(unique=True, max_length=127)
    flags = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now=True)
    creation_ip = models.CharField(max_length=127)
    avatar_updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'users'

