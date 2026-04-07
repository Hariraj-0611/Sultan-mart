from django.contrib import admin
from .models import Cart, CartItem, OnlineOrder, OnlineOrderItem


class OnlineOrderItemInline(admin.TabularInline):
    model = OnlineOrderItem
    extra = 0


@admin.register(OnlineOrder)
class OnlineOrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'customer', 'total_amount', 'status', 'created_at']
    list_filter = ['status']
    inlines = [OnlineOrderItemInline]
