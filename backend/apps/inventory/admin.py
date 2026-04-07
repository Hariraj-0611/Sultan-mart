from django.contrib import admin
from .models import Category, Unit, Product, Batch, StockMovement


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent']
    list_filter = ['parent']


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ['name', 'abbreviation']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'sku', 'barcode', 'category', 'selling_price', 'stock_quantity', 'is_active']
    list_filter = ['category', 'gst_rate', 'is_active']
    search_fields = ['name', 'sku', 'barcode']
    list_editable = ['selling_price', 'is_active']


@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = ['product', 'batch_number', 'expiry_date', 'quantity']
    list_filter = ['expiry_date']


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ['product', 'movement_type', 'quantity', 'reference', 'created_at']
    list_filter = ['movement_type']
    readonly_fields = ['created_at']
