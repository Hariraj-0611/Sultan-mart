from celery import shared_task
from django.db.models import F


@shared_task
def check_low_stock_alert():
    """Send low stock alerts - runs daily via Celery Beat"""
    from .models import Product
    low = Product.objects.filter(
        stock_quantity__lte=F('low_stock_threshold'), is_active=True
    ).values('name', 'stock_quantity', 'low_stock_threshold')

    if low.exists():
        items = list(low)
        # Log to console / can extend to email/WhatsApp
        print(f"LOW STOCK ALERT: {len(items)} products need reorder")
        for item in items:
            print(f"  - {item['name']}: {item['stock_quantity']} remaining (threshold: {item['low_stock_threshold']})")
    return f"Checked {low.count()} low stock items"


@shared_task
def check_expiring_batches():
    """Alert for batches expiring within 7 days"""
    from django.utils import timezone
    from .models import Batch
    cutoff = timezone.now().date() + timezone.timedelta(days=7)
    expiring = Batch.objects.filter(
        expiry_date__lte=cutoff,
        expiry_date__gte=timezone.now().date()
    ).select_related('product')

    for batch in expiring:
        print(f"EXPIRY ALERT: {batch.product.name} batch {batch.batch_number} expires on {batch.expiry_date}")
    return f"Checked {expiring.count()} expiring batches"
