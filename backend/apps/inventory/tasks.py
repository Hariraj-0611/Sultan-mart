import logging
from celery import shared_task
from django.db.models import F

logger = logging.getLogger(__name__)


@shared_task
def check_low_stock_alert():
    """Send low stock alerts - runs daily via Celery Beat"""
    from .models import Product
    low = Product.objects.filter(
        stock_quantity__lte=F('low_stock_threshold'), is_active=True
    ).values('name', 'stock_quantity', 'low_stock_threshold')

    if low.exists():
        items = list(low)
        logger.warning("LOW STOCK ALERT: %d products need reorder", len(items))
        for item in items:
            logger.warning("  - %s: %s remaining (threshold: %s)",
                           item['name'], item['stock_quantity'], item['low_stock_threshold'])
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
        logger.warning("EXPIRY ALERT: %s batch %s expires on %s",
                       batch.product.name, batch.batch_number, batch.expiry_date)
    return f"Checked {expiring.count()} expiring batches"
