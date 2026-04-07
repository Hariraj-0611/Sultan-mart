from django.contrib import admin
from .models import Customer, Supplier, PurchaseOrder, PurchaseItem, Expense, CustomerPayment


class PurchaseItemInline(admin.TabularInline):
    model = PurchaseItem
    extra = 0


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'email', 'outstanding_balance', 'credit_limit', 'is_active']
    search_fields = ['name', 'phone']
    list_filter = ['is_active']


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'outstanding_balance', 'is_active']
    search_fields = ['name', 'phone']


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ['po_number', 'supplier', 'total_amount', 'status', 'created_at']
    list_filter = ['status']
    inlines = [PurchaseItemInline]


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'amount', 'date']
    list_filter = ['category', 'date']


@admin.register(CustomerPayment)
class CustomerPaymentAdmin(admin.ModelAdmin):
    list_display = ['customer', 'amount', 'payment_method', 'created_at']
