from django.db import models
from django.contrib.postgres.fields import ArrayField

# Create your models here.
class Tournaments(models.Model):
    players = ArrayField(models.IntegerField(blank=True, null=True), blank=True, null=True, size=8)
    ranks = ArrayField(models.IntegerField(blank=True, null=True), blank=True, null=True, size=8)
    matches = ArrayField(models.IntegerField(blank=True, null=True), blank=True, null=True, size=7)
    created_at = models.DateTimeField(auto_now=True)
    duration = models.SmallIntegerField(default=0)
    winner = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'tournaments'
