from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, UnitViewSet, ProductViewSet, BatchViewSet, StockMovementViewSet

router = DefaultRouter()
router.register('categories', CategoryViewSet)
router.register('units', UnitViewSet)
router.register('products', ProductViewSet)
router.register('batches', BatchViewSet)
router.register('stock-movements', StockMovementViewSet)

urlpatterns = [path('', include(router.urls))]
