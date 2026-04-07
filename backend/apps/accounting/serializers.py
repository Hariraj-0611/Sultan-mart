from rest_framework import serializers
from .models import Customer, Supplier, PurchaseOrder, PurchaseItem, Expense, CustomerPayment


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'


class PurchaseItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseItem
        fields = ['id', 'product', 'quantity', 'unit_price', 'total_price']
        # purchase_order is set automatically during PurchaseOrder.create — not required from client


class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseItemSerializer(many=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = '__all__'
        read_only_fields = ['created_by', 'po_number']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        import datetime
        po_number = f"PO{datetime.date.today().strftime('%Y%m%d')}{PurchaseOrder.objects.count() + 1:04d}"
        po = PurchaseOrder.objects.create(po_number=po_number, **validated_data)
        total = 0
        for item_data in items_data:
            item = PurchaseItem.objects.create(purchase_order=po, **item_data)
            total += float(item.total_price)
            # Update stock and purchase price
            product = item.product
            product.stock_quantity += item.quantity
            product.purchase_price = item.unit_price
            product.save()
            from apps.inventory.models import StockMovement
            StockMovement.objects.create(
                product=product,
                movement_type=StockMovement.TYPE_IN,
                quantity=item.quantity,
                reference=po_number,
                created_by=po.created_by,
            )
        po.total_amount = total
        po.status = PurchaseOrder.STATUS_RECEIVED
        po.save()
        return po


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ['created_by']


class CustomerPaymentSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)

    class Meta:
        model = CustomerPayment
        fields = '__all__'
        read_only_fields = ['created_by']
