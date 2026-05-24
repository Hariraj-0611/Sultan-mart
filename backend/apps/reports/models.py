from django.db import models


class StoreSettings(models.Model):
    """Single-row table for store configuration — use get_settings() to access."""
    store_name    = models.CharField(max_length=200, default='Sultan Mart')
    store_address = models.TextField(blank=True, default='')
    store_phone   = models.CharField(max_length=30, blank=True, default='')
    store_gst     = models.CharField(max_length=20, blank=True, default='')
    admin_pin     = models.CharField(max_length=10, default='1234')
    receipt_footer = models.CharField(max_length=300, default='Thank you! Visit Again.')
    show_gst_on_receipt = models.BooleanField(default=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'store_settings'

    def __str__(self):
        return self.store_name

    @classmethod
    def get_settings(cls):
        """Always returns the single settings row, creating it if needed."""
        obj, _ = cls.objects.get_or_create(
            pk=1,
            defaults={
                'store_name':    __import__('django.conf', fromlist=['settings']).settings.__dict__.get('STORE_NAME', 'Sultan Mart'),
                'store_address': __import__('django.conf', fromlist=['settings']).settings.__dict__.get('STORE_ADDRESS', ''),
                'store_phone':   __import__('django.conf', fromlist=['settings']).settings.__dict__.get('STORE_PHONE', ''),
                'store_gst':     __import__('django.conf', fromlist=['settings']).settings.__dict__.get('STORE_GST', ''),
                'admin_pin':     __import__('django.conf', fromlist=['settings']).settings.__dict__.get('ADMIN_PIN', '1234'),
            }
        )
        return obj
