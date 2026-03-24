from rest_framework import serializers
from .models import VehicleProfile

class VehicleProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model=VehicleProfile
        fields='__all__'

class OptimizeRouteSerializer(serializers.Serializer):
    start = serializers.DictField()
    end = serializers.DictField()
    vehicle_id = serializers.IntegerField(required=False)
    mileage = serializers.FloatField(required=False)
    idle_consumption = serializers.FloatField(required=False)