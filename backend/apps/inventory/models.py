from django.db import models
from django.utils import timezone


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='subcategories')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'categories'

    def __str__(self):
        return self.name


class Unit(models.Model):
    name = models.CharField(max_length=50, unique=True)  # kg, pcs, litre, etc.
    abbreviation = models.CharField(max_length=10)

    class Meta:
        db_table = 'units'

    def __str__(self):
        return self.abbreviation


class Product(models.Model):
    GST_CHOICES = [(0, '0%'), (5, '5%'), (12, '12%'), (18, '18%'), (28, '28%')]

    name = models.CharField(max_length=200, db_index=True)
    sku = models.CharField(max_length=50, unique=True, db_index=True)
    barcode = models.CharField(max_length=100, blank=True, db_index=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    unit = models.ForeignKey(Unit, on_delete=models.SET_NULL, null=True)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)
    mrp = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    gst_rate = models.IntegerField(choices=GST_CHOICES, default=0)
    stock_quantity = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    low_stock_threshold = models.DecimalField(max_digits=10, decimal_places=3, default=10)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    track_expiry = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products'
        indexes = [models.Index(fields=['name', 'sku', 'barcode'])]

    def __str__(self):
        return self.name

    @property
    def is_low_stock(self):
        return self.stock_quantity <= self.low_stock_threshold

    @property
    def gst_amount(self):
        return (self.selling_price * self.gst_rate) / 100


class Batch(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='batches')
    batch_number = models.CharField(max_length=100)
    manufacturing_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'batches'

    def __str__(self):
        return f"{self.product.name} - {self.batch_number}"

    @property
    def is_expired(self):
        return self.expiry_date and self.expiry_date < timezone.now().date()

    @property
    def days_to_expiry(self):
        if self.expiry_date:
            return (self.expiry_date - timezone.now().date()).days
        return None


class StockMovement(models.Model):
    TYPE_IN = 'in'
    TYPE_OUT = 'out'
    TYPE_ADJUSTMENT = 'adjustment'
    TYPE_CHOICES = [
        (TYPE_IN, 'Stock In'),
        (TYPE_OUT, 'Stock Out'),
        (TYPE_ADJUSTMENT, 'Adjustment'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='movements')
    movement_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    quantity = models.DecimalField(max_digits=10, decimal_places=3)
    reference = models.CharField(max_length=100, blank=True)  # invoice/purchase number
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'stock_movements'
        ordering = ['-created_at']
