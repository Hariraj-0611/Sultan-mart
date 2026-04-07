from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, SupplierViewSet, PurchaseOrderViewSet, ExpenseViewSet, CustomerPaymentViewSet

router = DefaultRouter()
router.register('customers', CustomerViewSet)
router.register('suppliers', SupplierViewSet)
router.register('purchases', PurchaseOrderViewSet)
router.register('expenses', ExpenseViewSet)
router.register('customer-payments', CustomerPaymentViewSet)

urlpatterns = [path('', include(router.urls))]
