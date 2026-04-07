"""Business logic for billing - keeps views clean"""
from decimal import Decimal
from django.db import transaction
from apps.inventory.models import Product, StockMovement
from apps.accounting.models import Customer
from .models import Invoice, InvoiceItem, PaymentSplit


class BillingService:

    @staticmethod
    @transaction.atomic
    def create_invoice(data: dict, cashier) -> Invoice:
        items_data = data.pop('items', [])
        splits_data = data.pop('payment_splits', [])

        # Django ORM requires customer_id for raw int, not customer=<int>
        if 'customer' in data:
            data['customer_id'] = data.pop('customer')

        subtotal = Decimal('0')
        gst_total = Decimal('0')
        discount_total = Decimal('0')

        # Validate and compute totals
        processed_items = []
        for item in items_data:
            product = Product.objects.select_for_update().get(id=item['product'])
            qty = Decimal(str(item['quantity']))
            unit_price = Decimal(str(item.get('unit_price', product.selling_price)))
            disc_pct = Decimal(str(item.get('discount_percent', 0)))

            line_subtotal = unit_price * qty
            disc_amt = (line_subtotal * disc_pct / 100).quantize(Decimal('0.01'))
            taxable = line_subtotal - disc_amt

            # GST is INCLUSIVE in selling price (MRP includes GST)
            # Extract GST from price instead of adding on top
            gst_rate = Decimal(str(product.gst_rate))
            if gst_rate > 0:
                # taxable_base = taxable / (1 + gst_rate/100)
                taxable_base = (taxable / (1 + gst_rate / 100)).quantize(Decimal('0.01'))
                gst_amt = (taxable - taxable_base).quantize(Decimal('0.01'))
            else:
                taxable_base = taxable
                gst_amt = Decimal('0')

            total = taxable  # total = selling price (GST already inside)

            subtotal += line_subtotal
            discount_total += disc_amt
            gst_total += gst_amt

            processed_items.append({
                'product': product,
                'product_name': product.name,
                'quantity': qty,
                'unit_price': unit_price,
                'mrp': Decimal(str(product.mrp or unit_price)),
                'discount_percent': disc_pct,
                'discount_amount': disc_amt,
                'gst_rate': product.gst_rate,
                'gst_amount': gst_amt,
                'total_price': total,
            })

            # Deduct stock
            product.stock_quantity -= qty
            product.save()
            StockMovement.objects.create(
                product=product,
                movement_type=StockMovement.TYPE_OUT,
                quantity=qty,
                created_by=cashier,
            )

        total_amount = subtotal - discount_total  # GST inclusive — no addition needed

        # Apply bill-level discount if provided
        bill_discount = Decimal(str(data.pop('discount_amount', 0) or 0))
        total_amount = max(total_amount - bill_discount, Decimal('0'))
        discount_total += bill_discount

        amount_paid_raw = data.pop('amount_paid', None)
        amount_paid = Decimal(str(amount_paid_raw if amount_paid_raw is not None else total_amount))
        change_amount = max(amount_paid - total_amount, Decimal('0'))
        credit_amount = max(total_amount - amount_paid, Decimal('0'))

        # Only pass known Invoice fields to avoid unexpected keyword errors
        ALLOWED = {'customer_id', 'payment_method', 'notes', 'status'}
        safe_data = {k: v for k, v in data.items() if k in ALLOWED}

        invoice = Invoice.objects.create(
            cashier=cashier,
            subtotal=subtotal,
            discount_amount=discount_total,
            gst_amount=gst_total,
            total_amount=total_amount,
            amount_paid=amount_paid,
            change_amount=change_amount,
            credit_amount=credit_amount,
            status=Invoice.STATUS_PARTIAL if credit_amount > 0 else Invoice.STATUS_PAID,
            **safe_data,
        )

        for item in processed_items:
            InvoiceItem.objects.create(invoice=invoice, **item)

        for split in splits_data:
            PaymentSplit.objects.create(invoice=invoice, **split)

        # Update customer credit if applicable
        if invoice.customer and credit_amount > 0:
            customer = invoice.customer
            customer.outstanding_balance += credit_amount
            customer.save()

        return invoice
