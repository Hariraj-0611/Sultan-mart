from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
import datetime
from .models import Cart, CartItem, OnlineOrder, OnlineOrderItem
from .serializers import CartSerializer, CartItemSerializer, OnlineOrderSerializer
from apps.inventory.models import Product
from apps.inventory.serializers import ProductListSerializer


class ProductCatalogViewSet(viewsets.ReadOnlyModelViewSet):
    """Public product listing for e-commerce"""
    queryset = Product.objects.filter(is_active=True, stock_quantity__gt=0).select_related('category', 'unit')
    serializer_class = ProductListSerializer
    permission_classes = []

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        if category:
            qs = qs.filter(category_id=category)
        if search:
            qs = qs.filter(name__icontains=search)
        return qs


class CartViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def retrieve(self, request, pk=None):
        cart, _ = Cart.objects.get_or_create(customer_id=pk)
        return Response(CartSerializer(cart).data)

    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        cart, _ = Cart.objects.get_or_create(customer_id=pk)
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))
        item, created = CartItem.objects.get_or_create(cart=cart, product_id=product_id)
        if not created:
            item.quantity += quantity
        else:
            item.quantity = quantity
        item.save()
        return Response(CartSerializer(cart).data)

    @action(detail=True, methods=['post'])
    def remove_item(self, request, pk=None):
        cart, _ = Cart.objects.get_or_create(customer_id=pk)
        CartItem.objects.filter(cart=cart, product_id=request.data.get('product_id')).delete()
        return Response(CartSerializer(cart).data)

    @action(detail=True, methods=['post'])
    def checkout(self, request, pk=None):
        cart = Cart.objects.prefetch_related('items__product').get(customer_id=pk)
        if not cart.items.exists():
            return Response({'error': 'Cart is empty'}, status=400)

        total = sum(item.product.selling_price * item.quantity for item in cart.items.all())
        order_number = f"ORD{timezone.now().strftime('%Y%m%d')}{OnlineOrder.objects.count() + 1:04d}"

        order = OnlineOrder.objects.create(
            order_number=order_number,
            customer_id=pk,
            total_amount=total,
            delivery_address=request.data.get('delivery_address', ''),
        )

        for item in cart.items.all():
            OnlineOrderItem.objects.create(
                order=order, product=item.product,
                quantity=item.quantity,
                unit_price=item.product.selling_price,
                total_price=item.product.selling_price * item.quantity,
            )

        cart.items.all().delete()
        return Response(OnlineOrderSerializer(order).data, status=201)


class OnlineOrderViewSet(viewsets.ModelViewSet):
    queryset = OnlineOrder.objects.select_related('customer').prefetch_related('items__product').all()
    serializer_class = OnlineOrderSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields    = ['order_number', 'customer__name', 'customer__phone']
    ordering_fields  = ['created_at']

    def get_permissions(self):
        if self.action in ['create', 'add_item', 'retrieve', 'guest_checkout', 'track_order']:
            return []
        return [IsAuthenticated()]

    @action(detail=False, methods=['get'], permission_classes=[])
    def track_order(self, request):
        """Public endpoint — search by order number or phone only"""
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response({'error': 'Query required'}, status=400)
        from django.db.models import Q
        orders = OnlineOrder.objects.filter(
            Q(order_number__iexact=q) | Q(customer__phone__icontains=q)
        ).select_related('customer').prefetch_related('items__product')[:5]
        return Response(OnlineOrderSerializer(orders, many=True).data)

    @action(detail=False, methods=['get'])
    def pending_count(self, request):
        """Used by sidebar badge — all authenticated staff can call this"""
        count = OnlineOrder.objects.filter(status=OnlineOrder.STATUS_PENDING).count()
        return Response({'count': count})

    @action(detail=True, methods=['post'], permission_classes=[])
    def add_item(self, request, pk=None):
        order = self.get_object()
        try:
            OnlineOrderItem.objects.create(
                order=order,
                product_id=request.data['product'],
                quantity=int(request.data['quantity']),
                unit_price=request.data['unit_price'],
                total_price=request.data['total_price'],
            )
            return Response({'status': 'item added'}, status=201)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        if new_status not in dict(OnlineOrder.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=400)
        order.status = new_status
        order.save()
        return Response({'status': order.status})

    def destroy(self, request, *args, **kwargs):
        order = self.get_object()
        order.items.all().delete()
        order.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


    @action(detail=False, methods=['post'], permission_classes=[])
    def guest_checkout(self, request):
        """
        All-in-one public endpoint:
        1. Find or create customer by phone
        2. Create order with items
        """
        from apps.accounting.models import Customer
        data = request.data
        name    = data.get('name', '').strip()
        phone   = data.get('phone', '').strip()
        address = data.get('delivery_address', '')
        notes   = data.get('notes', '')
        items   = data.get('items', [])
        total   = data.get('total_amount', 0)
        payment = data.get('payment_method', 'cod')

        if not name or not phone:
            return Response({'error': 'Name and phone are required'}, status=400)
        if not items:
            return Response({'error': 'No items in order'}, status=400)

        # Find or create customer
        customer, _ = Customer.objects.get_or_create(
            phone=phone,
            defaults={'name': name, 'address': address}
        )
        # Update name/address if customer exists
        if customer.name != name:
            customer.name = name
        if address:
            customer.address = address
        customer.save()

        # Create order
        order_number = f"ORD{__import__('time').time_ns() // 1000000}"
        order = OnlineOrder.objects.create(
            order_number=order_number,
            customer=customer,
            total_amount=total,
            delivery_address=address,
            notes=f"Payment: {payment.upper()}. {notes}",
            status=OnlineOrder.STATUS_PENDING,
        )

        for item in items:
            try:
                OnlineOrderItem.objects.create(
                    order=order,
                    product_id=item['product'],
                    quantity=int(item['quantity']),
                    unit_price=item['unit_price'],
                    total_price=item['total_price'],
                )
            except Exception:
                pass

        return Response({
            'order_number': order.order_number,
            'order_id': order.id,
            'customer_name': customer.name,
            'total_amount': float(order.total_amount),
            'status': order.status,
        }, status=201)
