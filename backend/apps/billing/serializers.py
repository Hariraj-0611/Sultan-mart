from rest_framework import serializers
from django.conf import settings
from .models import Invoice, InvoiceItem, PaymentSplit


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = '__all__'
        read_only_fields = ['product_name', 'gst_amount', 'total_price']


class PaymentSplitSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentSplit
        fields = '__all__'


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True)
    payment_splits = PaymentSplitSerializer(many=True, required=False)
    customer_name  = serializers.CharField(source='customer.name',  read_only=True)
    customer_phone = serializers.SerializerMethodField()
    cashier_name   = serializers.CharField(source='cashier.username', read_only=True)

    def get_customer_phone(self, obj):
        return obj.customer.phone if obj.customer else None
    store_name    = serializers.SerializerMethodField()
    store_address = serializers.SerializerMethodField()
    store_phone   = serializers.SerializerMethodField()
    store_gst     = serializers.SerializerMethodField()

    def get_store_name(self, obj):    return getattr(settings, 'STORE_NAME', '')
    def get_store_address(self, obj): return getattr(settings, 'STORE_ADDRESS', '')
    def get_store_phone(self, obj):   return getattr(settings, 'STORE_PHONE', '')
    def get_store_gst(self, obj):     return getattr(settings, 'STORE_GST', '')

    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ['invoice_number', 'cashier', 'subtotal', 'gst_amount',
                            'total_amount', 'change_amount']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        splits_data = validated_data.pop('payment_splits', [])
        invoice = Invoice.objects.create(**validated_data)
        for item_data in items_data:
            InvoiceItem.objects.create(invoice=invoice, **item_data)
        for split_data in splits_data:
            PaymentSplit.objects.create(invoice=invoice, **split_data)
        return invoice


class InvoiceListSerializer(serializers.ModelSerializer):
    customer_name  = serializers.CharField(source='customer.name',  read_only=True)
    cashier_name   = serializers.CharField(source='cashier.username', read_only=True)
    customer_phone = serializers.SerializerMethodField()

    def get_customer_phone(self, obj):
        return obj.customer.phone if obj.customer else None

    class Meta:
        model = Invoice
        fields = ['id', 'invoice_number', 'customer_name', 'customer_phone', 'cashier_name',
                  'total_amount', 'payment_method', 'status', 'created_at']
