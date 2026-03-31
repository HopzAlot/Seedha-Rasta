from django.db import models


class VehicleProfile(models.Model):

    class VehicleType(models.TextChoices):
        CAR = "car", "Car (Generic)"
        SEDAN = "sedan", "Sedan"
        SUV = "suv", "SUV"
        BIKE = "bike", "Bike"
        TRUCK = "truck", "Truck"
        BUS = "bus", "Bus"
        OTHER = "other", "Other"

    # Default values for each vehicle type
    DEFAULTS = {
        "car": {"mileage": 14, "idle": 0.8},
        "sedan": {"mileage": 16, "idle": 0.7},
        "suv": {"mileage": 10, "idle": 1.2},
        "bike": {"mileage": 35, "idle": 0.3},
        "truck": {"mileage": 5, "idle": 2.5},
        "bus": {"mileage": 4, "idle": 3.0},
        "other": {"mileage": 12, "idle": 1.0},
    }

    id = models.IntegerField(primary_key=True)

    name = models.CharField(max_length=100)

    vehicle_type = models.CharField(
        max_length=20,
        choices=VehicleType.choices,
        default=VehicleType.CAR
    )

    mileage = models.FloatField(
        null=True,
        blank=True,
        help_text="km per liter"
    )

    idle_consumption = models.FloatField(
        null=True,
        blank=True,
        help_text="liters per hour"
    )

    def save(self, *args, **kwargs):
        defaults = self.DEFAULTS.get(self.vehicle_type)

        if defaults:
            if self.mileage is None:
                self.mileage = defaults["mileage"]

            if self.idle_consumption is None:
                self.idle_consumption = defaults["idle"]

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.get_vehicle_type_display()})"