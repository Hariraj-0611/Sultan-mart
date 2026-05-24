from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from .models import Customer, Supplier, PurchaseOrder, Expense, CustomerPayment
from .serializers import (CustomerSerializer, SupplierSerializer, PurchaseOrderSerializer,
                           ExpenseSerializer, CustomerPaymentSerializer)


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.filter(is_active=True).order_by('name')
    serializer_class = CustomerSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name', 'phone', 'email']

    def get_permissions(self):
        # Allow public create (for online store checkout) and search by phone
        if self.action in ['create', 'list']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def destroy(self, request, *args, **kwargs):
        customer = self.get_object()
        # Soft delete — preserve linked invoices/payments
        customer.is_active = False
        customer.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'])
    def ledger(self, request, pk=None):
        customer = self.get_object()
        invoices = customer.invoices.all().values(
            'invoice_number', 'total_amount', 'amount_paid', 'credit_amount', 'created_at'
        )
        payments = customer.payments.all().values('amount', 'payment_method', 'created_at')
        return Response({
            'customer': CustomerSerializer(customer).data,
            'invoices': list(invoices),
            'payments': list(payments),
            'outstanding_balance': customer.outstanding_balance,
        })

    @action(detail=True, methods=['post'])
    def receive_payment(self, request, pk=None):
        from decimal import Decimal
        customer = self.get_object()
        try:
            amount = Decimal(str(request.data.get('amount', 0)))
        except:
            return Response({'error': 'Invalid amount format'}, status=400)
            
        if amount <= 0:
            return Response({'error': 'Amount must be greater than zero'}, status=400)
            
        CustomerPayment.objects.create(
            customer=customer, amount=amount,
            payment_method=request.data.get('payment_method', 'cash'),
            notes=request.data.get('notes', ''),
            created_by=request.user if request.user.is_authenticated else None,
        )
        customer.outstanding_balance = max(Decimal('0'), customer.outstanding_balance - amount)
        customer.save()
        return Response({'outstanding_balance': str(customer.outstanding_balance)})


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.filter(is_active=True).order_by('name')
    serializer_class = SupplierSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'phone']

    def destroy(self, request, *args, **kwargs):
        supplier = self.get_object()
        supplier.is_active = False
        supplier.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.select_related('supplier').prefetch_related('items').all()
    serializer_class = PurchaseOrderSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['supplier', 'status']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_received(self, request, pk=None):
        """Mark PO as received and auto-update stock quantities"""
        from apps.inventory.models import Product, StockMovement
        po = self.get_object()
        if po.status == PurchaseOrder.STATUS_RECEIVED:
            return Response({'error': 'Already received'}, status=400)

        for item in po.items.all():
            product = item.product
            product.stock_quantity += item.quantity
            # Update purchase price if provided
            if item.unit_price:
                product.purchase_price = item.unit_price
            product.save()
            StockMovement.objects.create(
                product=product,
                movement_type=StockMovement.TYPE_IN,
                quantity=item.quantity,
                reference=po.po_number,
                notes=f'Purchase Order {po.po_number} received',
                created_by=request.user,
            )

        po.status = PurchaseOrder.STATUS_RECEIVED
        po.save()
        return Response({'status': 'received', 'message': f'Stock updated for {po.items.count()} products'})


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['category', 'date']
    ordering_fields = ['date', 'amount']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class CustomerPaymentViewSet(viewsets.ModelViewSet):
    queryset = CustomerPayment.objects.select_related('customer').all()
    serializer_class = CustomerPaymentSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['customer']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
