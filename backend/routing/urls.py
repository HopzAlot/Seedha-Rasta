from rest_framework.routers import DefaultRouter
from .views import HistoryAPIView, VehicleProfileViewSet, OptimizeRouteAPIView, FuelPriceAPIView
from django.urls import path

router=DefaultRouter()
router.register(r'vehicles',VehicleProfileViewSet)

urlpatterns=[
    path('route/optimize/', OptimizeRouteAPIView.as_view(), name='optimize-route'), 
    path('route/fuel-price/', FuelPriceAPIView.as_view(), name='fuel-price'),
    path('route/history/', HistoryAPIView.as_view(), name='history'),
]

urlpatterns+=router.urls