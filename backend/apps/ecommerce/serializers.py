from rest_framework import serializers
from .models import Cart, CartItem, OnlineOrder, OnlineOrderItem
from apps.inventory.serializers import ProductListSerializer


class CartItemSerializer(serializers.ModelSerializer):
    product_detail = ProductListSerializer(source='product', read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_detail', 'quantity']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total', 'updated_at']

    def get_total(self, obj):
        return sum(item.product.selling_price * item.quantity for item in obj.items.all())


class OnlineOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = OnlineOrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'unit_price', 'total_price']


class OnlineOrderSerializer(serializers.ModelSerializer):
    items = OnlineOrderItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)

    class Meta:
        model = OnlineOrder
        fields = '__all__'
        # order_number is provided by client (frontend generates it)
        extra_kwargs = {
            'order_number': {'required': True},
        }
