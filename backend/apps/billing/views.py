from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
import logging
from .models import Invoice
from .serializers import InvoiceSerializer, InvoiceListSerializer
from .services import BillingService
from .receipt import generate_receipt_pdf
from .tasks import send_whatsapp_receipt

logger = logging.getLogger(__name__)


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related('customer', 'cashier').prefetch_related('items').all()
    serializer_class = InvoiceSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_method', 'customer', 'cashier']
    ordering_fields = ['created_at', 'total_amount']

    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        return InvoiceSerializer

    def create(self, request, *args, **kwargs):
        """Create invoice via billing service (handles stock, totals, credit)"""
        data = request.data.copy()
        try:
            invoice = BillingService.create_invoice(data, request.user)
            return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.exception('Invoice creation failed: %s | data: %s', e, request.data)
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def receipt_pdf(self, request, pk=None):
        invoice = self.get_object()
        pdf = generate_receipt_pdf(invoice)
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="receipt_{invoice.invoice_number}.pdf"'
        return response

    @action(detail=True, methods=['post'])
    def send_whatsapp(self, request, pk=None):
        invoice = self.get_object()
        phone = request.data.get('phone') or (invoice.customer.phone if invoice.customer else None)
        if not phone:
            return Response({'error': 'Phone number required'}, status=400)
        # Send directly without Celery
        try:
            from twilio.rest import Client
            from django.conf import settings as django_settings
            clean_phone = ''.join(filter(str.isdigit, phone))
            if len(clean_phone) == 10:
                clean_phone = '91' + clean_phone
            client = Client(django_settings.TWILIO_ACCOUNT_SID, django_settings.TWILIO_AUTH_TOKEN)
            items_text = '\n'.join([f"  {item.product_name} x{item.quantity} = Rs.{item.total_price}" for item in invoice.items.all()])
            message_body = (
                f"*{django_settings.STORE_NAME}*\n"
                f"Invoice: {invoice.invoice_number}\n"
                f"Date: {invoice.created_at.strftime('%d-%m-%Y %H:%M')}\n\n"
                f"{items_text}\n\n"
                f"*TOTAL: Rs. {invoice.total_amount}*\n"
                f"Payment: {invoice.payment_method.upper()}\n\n"
                f"Thank you for shopping!"
            )
            client.messages.create(
                body=message_body,
                from_=django_settings.TWILIO_WHATSAPP_FROM,
                to=f"whatsapp:+{clean_phone}",
            )
            return Response({'message': f'WhatsApp sent to +{clean_phone}'})
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=False, methods=['get'])
    def today(self, request):
        import datetime
        today = datetime.date.today()
        invoices = Invoice.objects.filter(created_at__date=today).select_related('customer', 'cashier')
        return Response(InvoiceListSerializer(invoices, many=True).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status == Invoice.STATUS_CANCELLED:
            return Response({'error': 'Already cancelled'}, status=400)
        invoice.status = Invoice.STATUS_CANCELLED
        invoice.save()
        # Restore stock
        for item in invoice.items.all():
            item.product.stock_quantity += item.quantity
            item.product.save()
        return Response({'status': 'cancelled'})

    def destroy(self, request, *args, **kwargs):
        invoice = self.get_object()
        # Delete items first to avoid PROTECT constraint on product FK
        invoice.items.all().delete()
        invoice.payment_splits.all().delete()
        invoice.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)