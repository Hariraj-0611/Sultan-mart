"""Thermal receipt (80mm) PDF generator using ReportLab"""
from io import BytesIO
from reportlab.lib.units import mm
from reportlab.lib.pagesizes import landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from django.conf import settings


PAGE_WIDTH = 80 * mm
PAGE_HEIGHT = 297 * mm  # will auto-trim


def generate_receipt_pdf(invoice) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=(PAGE_WIDTH, PAGE_HEIGHT),
        rightMargin=3 * mm,
        leftMargin=3 * mm,
        topMargin=4 * mm,
        bottomMargin=4 * mm,
    )

    styles = getSampleStyleSheet()
    center = ParagraphStyle('center', parent=styles['Normal'], alignment=TA_CENTER, fontSize=8)
    bold_center = ParagraphStyle('bold_center', parent=center, fontName='Helvetica-Bold', fontSize=10)
    small = ParagraphStyle('small', parent=styles['Normal'], fontSize=7)
    right = ParagraphStyle('right', parent=styles['Normal'], alignment=TA_RIGHT, fontSize=8)

    story = []

    # Header
    story.append(Paragraph(settings.STORE_NAME, bold_center))
    if settings.STORE_ADDRESS:
        story.append(Paragraph(settings.STORE_ADDRESS, center))
    if settings.STORE_PHONE:
        story.append(Paragraph(f"Ph: {settings.STORE_PHONE}", center))
    if settings.STORE_GST:
        story.append(Paragraph(f"GSTIN: {settings.STORE_GST}", center))
    story.append(HRFlowable(width='100%', thickness=0.5))

    # Invoice info
    story.append(Paragraph(f"Invoice: {invoice.invoice_number}", small))
    story.append(Paragraph(f"Date: {invoice.created_at.strftime('%d-%m-%Y %H:%M')}", small))
    if invoice.customer:
        story.append(Paragraph(f"Customer: {invoice.customer.name}", small))
        if invoice.customer.phone:
            story.append(Paragraph(f"Phone: {invoice.customer.phone}", small))
        if invoice.customer.phone:
            story.append(Paragraph(f"Phone: {invoice.customer.phone}", small))
    story.append(HRFlowable(width='100%', thickness=0.5))

    # Items table
    col_widths = [38 * mm, 10 * mm, 12 * mm, 12 * mm]
    table_data = [['Item', 'Qty', 'Rate', 'Amt']]
    for item in invoice.items.all():
        table_data.append([
            item.product_name[:22],
            str(item.quantity),
            f"{item.unit_price:.2f}",
            f"{item.total_price:.2f}",
        ])

    t = Table(table_data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 7),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('LINEBELOW', (0, 0), (-1, 0), 0.5, colors.black),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
    ]))
    story.append(t)
    story.append(HRFlowable(width='100%', thickness=0.5))

    # Totals
    totals = [
        ['Subtotal:', f"Rs. {invoice.subtotal:.2f}"],
        ['Discount:', f"- Rs. {invoice.discount_amount:.2f}"],
        ['GST:', f"Rs. {invoice.gst_amount:.2f}"],
        ['TOTAL:', f"Rs. {invoice.total_amount:.2f}"],
        ['Paid:', f"Rs. {invoice.amount_paid:.2f}"],
        ['Change:', f"Rs. {invoice.change_amount:.2f}"],
    ]
    for row in totals:
        is_total = row[0] == 'TOTAL:'
        style = ParagraphStyle('t', parent=styles['Normal'], fontSize=8,
                               fontName='Helvetica-Bold' if is_total else 'Helvetica')
        story.append(Table(
            [[Paragraph(row[0], style), Paragraph(row[1], right)]],
            colWidths=[40 * mm, 34 * mm],
        ))

    story.append(HRFlowable(width='100%', thickness=0.5))
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph("Thank you! Visit again.", center))
    story.append(Paragraph("Powered by Sultan Mart", center))

    doc.build(story)
    return buffer.getvalue()
