from celery import shared_task
from django.conf import settings


@shared_task
def send_whatsapp_receipt(invoice_id: int, phone: str):
    """Send receipt via WhatsApp using Twilio"""
    try:
        from twilio.rest import Client
        from .models import Invoice
        from .receipt import generate_receipt_pdf

        invoice = Invoice.objects.get(id=invoice_id)
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

        message_body = (
            f"*{settings.STORE_NAME}*\n"
            f"Invoice: {invoice.invoice_number}\n"
            f"Date: {invoice.created_at.strftime('%d-%m-%Y %H:%M')}\n"
            f"Total: Rs. {invoice.total_amount}\n"
            f"Payment: {invoice.get_payment_method_display()}\n"
            f"Thank you for shopping with us!"
        )

        client.messages.create(
            body=message_body,
            from_=settings.TWILIO_WHATSAPP_FROM,
            to=f"whatsapp:{phone}",
        )
        return f"WhatsApp sent to {phone}"
    except Exception as e:
        return f"Failed: {str(e)}"


@shared_task
def auto_backup_database():
    """Trigger MySQL database backup"""
    import subprocess
    import os
    from datetime import datetime
    from django.conf import settings

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_dir = settings.BASE_DIR / 'backups'
    backup_dir.mkdir(exist_ok=True)
    filename = backup_dir / f"backup_{timestamp}.sql"

    db = settings.DATABASES['default']

    subprocess.run([
        'mysqldump',
        f"--host={db['HOST']}",
        f"--port={db['PORT']}",
        f"--user={db['USER']}",
        f"--password={db['PASSWORD']}",
        db['NAME'],
        f"--result-file={str(filename)}",
    ], check=True)

    return f"Backup saved: {filename}"
