from django.db import models

# Create your models here.

class Movie(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    year = models.IntegerField()
    poster_url = models.CharField(max_length=500, blank=True)
    tmdb_id = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return self.title