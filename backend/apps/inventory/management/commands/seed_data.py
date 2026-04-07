"""
Management command to seed initial demo data.
Usage: python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from apps.accounts.models import User
from apps.inventory.models import Category, Unit, Product
from apps.accounting.models import Customer, Supplier


class Command(BaseCommand):
    help = 'Seed initial data for Sultan Mart'

    def handle(self, *args, **options):
        self.stdout.write('Seeding data...')

        # Single shop owner login (cashier role — PIN switches to admin mode in UI)
        if not User.objects.filter(username='cashier').exists():
            u = User(username='cashier', role='cashier', first_name='Shop', last_name='Owner')
            u.set_password('cashier123')
            u.save()
            self.stdout.write(self.style.SUCCESS('  Created shop owner (cashier / cashier123)'))
        else:
            self.stdout.write('  Shop owner already exists')

        # Units
        units_data = [('Pieces', 'pcs'), ('Kilogram', 'kg'), ('Gram', 'g'),
                      ('Litre', 'L'), ('Millilitre', 'mL'), ('Box', 'box'), ('Packet', 'pkt')]
        units = {}
        for name, abbr in units_data:
            u, _ = Unit.objects.get_or_create(name=name, defaults={'abbreviation': abbr})
            units[abbr] = u
        self.stdout.write(self.style.SUCCESS(f'  Created {len(units_data)} units'))

        # Categories
        cats_data = ['Groceries', 'Beverages', 'Snacks', 'Dairy', 'Personal Care',
                     'Household', 'Stationery', 'Electronics']
        cats = {}
        for name in cats_data:
            c, _ = Category.objects.get_or_create(name=name)
            cats[name] = c
        self.stdout.write(self.style.SUCCESS(f'  Created {len(cats_data)} categories'))

        # Sample products
        products = [
            ('Rice (Ponni)', 'RICE001', '8901234567890', 'Groceries', 'kg', 45, 55, 60, 5, 50),
            ('Toor Dal', 'DAL001', '8901234567891', 'Groceries', 'kg', 90, 110, 120, 5, 20),
            ('Sunflower Oil 1L', 'OIL001', '8901234567892', 'Groceries', 'L', 120, 145, 150, 5, 30),
            ('Milk 500ml', 'MILK001', '8901234567893', 'Dairy', 'mL', 22, 28, 30, 5, 50),
            ('Curd 200g', 'CURD001', '8901234567894', 'Dairy', 'g', 18, 25, 28, 5, 30),
            ('Biscuits (Parle-G)', 'BISC001', '8901234567895', 'Snacks', 'pkt', 5, 10, 10, 12, 100),
            ('Chips (Lays)', 'CHIP001', '8901234567896', 'Snacks', 'pkt', 15, 20, 20, 12, 60),
            ('Coca Cola 500ml', 'COLA001', '8901234567897', 'Beverages', 'mL', 20, 30, 30, 12, 48),
            ('Shampoo (Clinic Plus)', 'SHMP001', '8901234567898', 'Personal Care', 'mL', 80, 110, 120, 18, 20),
            ('Soap (Lux)', 'SOAP001', '8901234567899', 'Personal Care', 'pcs', 25, 35, 40, 18, 40),
            ('Detergent (Surf Excel)', 'DET001', '8901234567900', 'Household', 'kg', 90, 120, 130, 18, 15),
            ('Notebook A4', 'NOTE001', '8901234567901', 'Stationery', 'pcs', 30, 45, 50, 12, 25),
        ]

        for name, sku, barcode, cat, unit_abbr, pp, sp, mrp, gst, stock in products:
            Product.objects.get_or_create(
                sku=sku,
                defaults={
                    'name': name, 'barcode': barcode,
                    'category': cats.get(cat),
                    'unit': units.get(unit_abbr),
                    'purchase_price': pp, 'selling_price': sp, 'mrp': mrp,
                    'gst_rate': gst, 'stock_quantity': stock,
                    'low_stock_threshold': 10,
                }
            )
        self.stdout.write(self.style.SUCCESS(f'  Created {len(products)} products'))

        # Sample customers
        customers = [
            ('Ravi Kumar', '+919876543210', 'ravi@example.com'),
            ('Priya Sharma', '+919876543211', ''),
            ('Mohammed Ali', '+919876543212', ''),
        ]
        for name, phone, email in customers:
            Customer.objects.get_or_create(phone=phone, defaults={'name': name, 'email': email})
        self.stdout.write(self.style.SUCCESS(f'  Created {len(customers)} customers'))

        # Sample supplier
        Supplier.objects.get_or_create(
            name='Chennai Wholesale Traders',
            defaults={'phone': '+914412345678', 'address': 'Koyambedu Market, Chennai'}
        )
        self.stdout.write(self.style.SUCCESS('  Created 1 supplier'))

        self.stdout.write(self.style.SUCCESS('\nDone! Sultan Mart is ready.'))
        self.stdout.write('  Admin login: admin / admin123')
        self.stdout.write('  Cashier login: cashier / cashier123')
