from rest_framework import serializers
from .models import Category, Unit, Product, Batch, StockMovement


class CategorySerializer(serializers.ModelSerializer):
    subcategories = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'parent', 'subcategories', 'created_at']

    def get_subcategories(self, obj):
        return CategorySerializer(obj.subcategories.all(), many=True).data


class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = '__all__'


class BatchSerializer(serializers.ModelSerializer):
    is_expired = serializers.ReadOnlyField()
    days_to_expiry = serializers.ReadOnlyField()

    class Meta:
        model = Batch
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    unit_name = serializers.CharField(source='unit.abbreviation', read_only=True)
    is_low_stock = serializers.ReadOnlyField()
    gst_amount = serializers.ReadOnlyField()
    batches = BatchSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = '__all__'


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for POS search"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    unit_name = serializers.CharField(source='unit.abbreviation', read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'sku', 'barcode', 'selling_price', 'mrp',
                  'gst_rate', 'stock_quantity', 'unit_name', 'category_name', 'image']


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = StockMovement
        fields = '__all__'
        read_only_fields = ['created_by']
