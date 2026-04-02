from rest_framework import serializers
from .models import History, VehicleProfile

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

class HistorySerializer(serializers.ModelSerializer):
    class Meta:
        model=History
        fields='__all__'