from django.db import models

# Create your models here.
FRIENDSHIP_PENDING  = 0
FRIENDSHIP_ACCEPTED = 1
FRIENDSHIP_REFUSED  = 2
class Friends(models.Model):
    sender = models.IntegerField()
    receiver = models.IntegerField()
    status = models.SmallIntegerField()
    created_at = models.DateTimeField(auto_now=True)
    accepted_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        managed = False
        db_table = 'friends'

class BlockedUsers(models.Model):
    blocker = models.IntegerField()
    blocked = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'blocked_users'
