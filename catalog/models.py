from django.db import models


class Genre(models.Model):
    name = models.CharField(max_length=100)
    def __str__(self):
        return self.name

class Movie(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    year = models.IntegerField()
    genres = models.ManyToManyField(Genre, blank=True)
    tmdb_id = models.IntegerField(null=True, blank=True)
    poster = models.ImageField(upload_to='posters/', null=True, blank=True)
   
    def __str__(self):
        return self.title

class Series(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    year = models.IntegerField()
    genres = models.ManyToManyField(Genre, blank=True)
    tmdb_id = models.IntegerField(null=True, blank=True)
    poster = models.ImageField(upload_to='posters/', null=True, blank=True)
    
    def __str__(self):
        return self.title

class Season(models.Model):
    series = models.ForeignKey(Series, on_delete=models.CASCADE, related_name="seasons")
    number = models.IntegerField()
    
    def __str__(self):
        return f"{self.series.title} - Season {self.number}"

class Episode(models.Model):
    season = models.ForeignKey(Season, on_delete=models.CASCADE, related_name="episodes")
    title = models.CharField(max_length=200)
    number = models.IntegerField()
    description = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.season.series.title} S{self.season.number}E{self.number}"
 