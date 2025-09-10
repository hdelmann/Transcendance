from django.db import models

# Create your models here.
class Matches(models.Model):
    player_1 = models.IntegerField()
    player_2 = models.IntegerField()
    status = models.SmallIntegerField()
    player_1_score = models.SmallIntegerField(default=0)
    player_2_score = models.SmallIntegerField(default=0)
    duration = models.SmallIntegerField(default=0)
    config = models.TextField()
    created_at = models.DateTimeField(auto_now=True)
    game_type = models.SmallIntegerField()
    
    class Meta:
        managed = False
        db_table = 'matches'
