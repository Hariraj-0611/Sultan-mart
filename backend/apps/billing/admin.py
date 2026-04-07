from django.contrib import admin
from .models import Invoice, InvoiceItem, PaymentSplit


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 0
    readonly_fields = ['product_name', 'gst_amount', 'total_price']


class PaymentSplitInline(admin.TabularInline):
    model = PaymentSplit
    extra = 0


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'customer', 'cashier', 'total_amount', 'payment_method', 'status', 'created_at']
    list_filter = ['status', 'payment_method', 'created_at']
    search_fields = ['invoice_number', 'customer__name']
    readonly_fields = ['invoice_number', 'created_at', 'updated_at']
    inlines = [InvoiceItemInline, PaymentSplitInline]
