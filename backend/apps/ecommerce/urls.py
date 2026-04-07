from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductCatalogViewSet, CartViewSet, OnlineOrderViewSet

router = DefaultRouter()
router.register('catalog', ProductCatalogViewSet, basename='catalog')
router.register('cart', CartViewSet, basename='cart')
router.register('orders', OnlineOrderViewSet)

urlpatterns = [path('', include(router.urls))]
