from django.contrib.postgres.fields import ArrayField
from django.db import models

# Create your models here.
class Channels(models.Model):
    created_at = models.DateTimeField()
    users = ArrayField(models.IntegerField(), size=2)

    class Meta:
        managed = False
        db_table = 'channels'

class Messages(models.Model):
    sender = models.IntegerField()
    channel_id = models.IntegerField()
    created_at = models.DateTimeField()
    game_key = models.CharField(max_length=36, blank=True, null=True)
    tournament_key = models.CharField(max_length=36, blank=True, null=True)
    content = models.CharField(max_length=127)

    class Meta:
        managed = False
        db_table = 'messages'