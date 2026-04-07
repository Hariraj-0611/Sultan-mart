from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from .models import Category, Unit, Product, Batch, StockMovement
from .serializers import (CategorySerializer, UnitSerializer, ProductSerializer,
                           ProductListSerializer, BatchSerializer, StockMovementSerializer)
from apps.accounts.permissions import IsManager, IsAdminOrReadOnly


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(parent=None).prefetch_related('subcategories')
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]

    @action(detail=False, methods=['get'])
    def flat(self, request):
        """All categories flat list"""
        qs = Category.objects.all().values('id', 'name', 'parent_id')
        return Response(list(qs))


class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    permission_classes = [IsAdminOrReadOnly]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category', 'unit').filter(is_active=True)
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'gst_rate', 'is_active']
    search_fields = ['name', 'sku', 'barcode']
    ordering_fields = ['name', 'selling_price', 'stock_quantity', 'created_at']

    def get_serializer_class(self):
        if self.action == 'pos_search':
            return ProductListSerializer
        return ProductSerializer

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()
        product.is_active = False
        product.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def pos_search(self, request):
        """Fast POS search by name, SKU, or barcode"""
        query = request.query_params.get('q', '')
        if not query:
            return Response([])
        products = Product.objects.select_related('category', 'unit').filter(
            Q(name__icontains=query) | Q(sku__icontains=query) | Q(barcode=query),
            is_active=True
        )[:20]
        return Response(ProductListSerializer(products, many=True, context={'request': request}).data)

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        from django.db.models import F
        products = Product.objects.filter(
            stock_quantity__lte=F('low_stock_threshold'), is_active=True
        )
        return Response(ProductListSerializer(products, many=True, context={'request': request}).data)

    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        days = int(request.query_params.get('days', 30))
        cutoff = timezone.now().date() + timezone.timedelta(days=days)
        batches = Batch.objects.filter(expiry_date__lte=cutoff, expiry_date__gte=timezone.now().date())
        return Response(BatchSerializer(batches, many=True).data)

    @action(detail=True, methods=['post'])
    def adjust_stock(self, request, pk=None):
        from decimal import Decimal
        product = self.get_object()
        quantity = request.data.get('quantity')
        notes = request.data.get('notes', '')
        if quantity is None:
            return Response({'error': 'quantity required'}, status=400)
        try:
            qty = Decimal(str(quantity))
        except Exception:
            return Response({'error': 'Invalid quantity'}, status=400)
        product.stock_quantity = Decimal(str(product.stock_quantity)) + qty
        product.save()
        StockMovement.objects.create(
            product=product,
            movement_type=StockMovement.TYPE_IN if qty > 0 else StockMovement.TYPE_ADJUSTMENT,
            quantity=abs(qty),
            notes=notes,
            created_by=request.user
        )
        return Response({'stock_quantity': float(product.stock_quantity)})


class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.select_related('product').all()
    serializer_class = BatchSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['product']


class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockMovement.objects.select_related('product', 'created_by').all()
    serializer_class = StockMovementSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['product', 'movement_type']
    ordering_fields = ['created_at']


