from django.db import models



class History(models.Model):
    # ------------------------------
    # 📍 Route Input
    # ------------------------------
    start_lat = models.FloatField()
    start_lng = models.FloatField()
    end_lat = models.FloatField()
    end_lng = models.FloatField()
    city = models.CharField(max_length=100, default="Lahore, Pakistan")

    # ------------------------------
    # 🚗 Vehicle Snapshot (important!)
    # ------------------------------
    mileage = models.FloatField(help_text="km per liter")
    idle_consumption = models.FloatField(help_text="liters per hour")
    fuel_price = models.FloatField(default=280)

    # ------------------------------
    # 🛣️ Route Outputs (compressed JSON)
    # ------------------------------
    fuel_route = models.JSONField()      # list of coords
    shortest_route = models.JSONField()

    # ------------------------------
    # 📊 Metrics (Fuel Optimized)
    # ------------------------------
    fuel_cost = models.FloatField()
    fuel_distance = models.FloatField()
    fuel_time = models.FloatField()
    fuel_cost_pkr = models.FloatField()

    # ------------------------------
    # 📊 Metrics (Shortest)
    # ------------------------------
    shortest_fuel_cost = models.FloatField()
    shortest_distance = models.FloatField()
    shortest_time = models.FloatField()
    shortest_cost_pkr = models.FloatField()

    # ------------------------------
    # ⚖️ Comparison Metrics
    # ------------------------------
    fuel_saved = models.FloatField()
    cost_saved = models.FloatField()
    time_saved = models.FloatField()
    distance_saved = models.FloatField()

    # ------------------------------
    # ⚙️ Metadata
    # ------------------------------
    cache_status = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    # ------------------------------
    # 🔮 Future-ready (optional)
    # ------------------------------
    # user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return f"{self.city} | Saved {self.fuel_saved:.2f}L"
    
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
