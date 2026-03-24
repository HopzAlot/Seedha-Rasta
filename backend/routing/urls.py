from rest_framework.routers import DefaultRouter
from .views import VehicleProfileViewSet, OptimizeRouteAPIView
from django.urls import path

router=DefaultRouter()
router.register(r'vehicles',VehicleProfileViewSet)

urlpatterns=[
    path('route/optimize/', OptimizeRouteAPIView.as_view(), name='optimize-route'), 
]

urlpatterns+=router.urls