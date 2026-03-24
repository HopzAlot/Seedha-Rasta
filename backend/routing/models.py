from django.db import models

# Create your models here.

class VehicleProfile(models.Model):
    id = models.IntegerField(primary_key=True)
    name=models.CharField(max_length=100)
    mileage=models.FloatField(help_text="km per liter")
    idle_consumption=models.FloatField(help_text="liters per hour")
    def __str__(self):
        return self.name
