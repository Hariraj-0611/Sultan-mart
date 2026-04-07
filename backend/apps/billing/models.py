from django.db import models
from django.utils import timezone
import uuid


def generate_invoice_number():
    today = timezone.now()
    prefix = f"INV{today.strftime('%Y%m%d')}"
    last = Invoice.objects.filter(invoice_number__startswith=prefix).count()
    return f"{prefix}{str(last + 1).zfill(4)}"


class Invoice(models.Model):
    STATUS_DRAFT = 'draft'
    STATUS_PAID = 'paid'
    STATUS_PARTIAL = 'partial'
    STATUS_CANCELLED = 'cancelled'
    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Draft'),
        (STATUS_PAID, 'Paid'),
        (STATUS_PARTIAL, 'Partial'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    PAYMENT_CASH = 'cash'
    PAYMENT_UPI = 'upi'
    PAYMENT_CARD = 'card'
    PAYMENT_CREDIT = 'credit'
    PAYMENT_MIXED = 'mixed'
    PAYMENT_CHOICES = [
        (PAYMENT_CASH, 'Cash'),
        (PAYMENT_UPI, 'UPI'),
        (PAYMENT_CARD, 'Card'),
        (PAYMENT_CREDIT, 'Credit'),
        (PAYMENT_MIXED, 'Mixed'),
    ]

    invoice_number = models.CharField(max_length=30, unique=True, db_index=True)
    customer = models.ForeignKey('accounting.Customer', on_delete=models.SET_NULL,
                                  null=True, blank=True, related_name='invoices')
    cashier = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PAID)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default=PAYMENT_CASH)

    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    gst_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    change_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    credit_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'invoices'
        ordering = ['-created_at']

    def __str__(self):
        return self.invoice_number

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = generate_invoice_number()
        super().save(*args, **kwargs)


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('inventory.Product', on_delete=models.PROTECT)
    product_name = models.CharField(max_length=200)  # snapshot
    quantity = models.DecimalField(max_digits=10, decimal_places=3)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    mrp = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # snapshot for "you saved"
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    gst_rate = models.IntegerField(default=0)
    gst_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'invoice_items'

    def __str__(self):
        return f"{self.product_name} x {self.quantity}"


class PaymentSplit(models.Model):
    """For mixed payment tracking"""
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payment_splits')
    method = models.CharField(max_length=20, choices=Invoice.PAYMENT_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reference = models.CharField(max_length=100, blank=True)  # UPI ref, card last4

    class Meta:
        db_table = 'payment_splits'
