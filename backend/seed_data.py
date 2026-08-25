import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'finvest_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import (
    Transaction, PortfolioAsset, PortfolioHistory,
    Budget, CategoryBudget, Event, EventTransaction
)

def seed():
    # Passwords strictly matching regex: ^(?=[A-Z])(?=.*[0-9])(?=.*[@#$%^&*!._-]).{8,50}$
    # (First letter Uppercase, Min 8 chars, contains number & special character)

    # 1. User 'nisu05' -> Password 'Punisher@2005'
    nisu05_user, _ = User.objects.get_or_create(username='nisu05', defaults={
        'email': 'bhojaninisarg72@gmail.com',
        'first_name': 'Nisu 05'
    })
    nisu05_user.set_password('Punisher@2005')
    nisu05_user.save()

    # 2. Admin user 'Admin' -> Password 'Admin@2005'
    admin_user, _ = User.objects.get_or_create(username='Admin', defaults={
        'email': 'admin@finvest.com',
        'first_name': 'System Admin',
        'is_staff': True,
        'is_superuser': True
    })
    admin_user.set_password('Admin@2005')
    admin_user.is_staff = True
    admin_user.is_superuser = True
    admin_user.save()

    # 3. User 'dhairya' -> Password 'Dhairya@2026'
    dhairya_user, _ = User.objects.get_or_create(username='dhairya', defaults={
        'email': 'dhairya211206@gmail.com',
        'first_name': 'Dhairya'
    })
    dhairya_user.set_password('Dhairya@2026')
    dhairya_user.save()

    # Seed financial data for users
    setup_rich_data(nisu05_user)
    setup_admin_data(admin_user)
    setup_standard_data(dhairya_user)

    print("Data seeding completed! All account passwords updated to match regex rule (First letter Capital, min 8 chars, number & special char).")

def setup_admin_data(user):
    Budget.objects.get_or_create(user=user, defaults={'monthly_budget': 25000.00})

    cat_budgets = [
        ('Server & Cloud Infra', 3500.00),
        ('Security & Compliance', 2500.00),
        ('Software Licenses', 1500.00),
    ]
    for cat, b in cat_budgets:
        CategoryBudget.objects.get_or_create(user=user, category=cat, defaults={'monthly_budget': b})

    txs = [
        (28000.00, 'income', '2026-07-01', 'Salary', 'Executive Admin & Platform Manager Salary'),
        (3500.00, 'expense', '2026-07-02', 'Server & Cloud Infra', 'AWS & Google Cloud High-Availability Infra'),
        (1200.00, 'expense', '2026-07-05', 'Security & Compliance', 'SSL Certificates & Penetration Audit'),
    ]
    for amt, t, d, c, desc in txs:
        Transaction.objects.get_or_create(
            user=user, date=d, category=c, amount=amt,
            defaults={'type': t, 'description': desc}
        )

    assets = [
        ('Berkshire Hathaway', 'BRK.B', 'Stocks', 420.00, 100, 350.00, '2023-01-10'),
        ('Microsoft Corp', 'MSFT', 'Stocks', 445.20, 50, 320.00, '2023-05-15'),
        ('Institutional Gold ETF', 'GLD', 'Gold & Precious Metals', 220.00, 200, 180.00, '2022-11-20'),
    ]
    for name, sym, atype, cur_p, qty, pur_p, pur_d in assets:
        asset_obj, _ = PortfolioAsset.objects.get_or_create(
            user=user, symbol=sym,
            defaults={
                'name': name, 'asset_type': atype,
                'current_price': cur_p, 'quantity': qty,
                'purchase_price': pur_p, 'purchase_date': pur_d
            }
        )
        if not PortfolioHistory.objects.filter(user=user, asset=asset_obj, price=cur_p).exists():
            PortfolioHistory.objects.create(user=user, asset=asset_obj, price=cur_p)

def setup_rich_data(user):
    Budget.objects.get_or_create(user=user, defaults={'monthly_budget': 15000.00})

    cat_budgets = [
        ('Food & Dining', 1300.00),
        ('Housing & Rent', 3800.00),
        ('Utilities & Bills', 900.00),
        ('Travel & Fuel', 800.00),
        ('Shopping & Lifestyle', 1500.00),
        ('Entertainment & Subscriptions', 500.00),
        ('Health & Wellness', 400.00),
    ]
    for cat, b in cat_budgets:
        CategoryBudget.objects.get_or_create(user=user, category=cat, defaults={'monthly_budget': b})

    txs = [
        (15000.00, 'income', '2026-07-01', 'Salary', 'Principal Tech Lead & Software Architect Paycheck'),
        (3500.00, 'income', '2026-07-05', 'Freelance', 'AI Cloud Infrastructure Advisory Fee'),
        (750.00, 'income', '2026-07-10', 'Investment Dividend', 'Quarterly Dividend Payout from Stock Portfolio'),
        (3400.00, 'expense', '2026-07-02', 'Housing & Rent', 'Penthouse Monthly Rent & Maintenance'),
        (620.00, 'expense', '2026-07-03', 'Food & Dining', 'Weekly Premium Organic Groceries'),
        (280.00, 'expense', '2026-07-04', 'Travel & Fuel', 'Car Full Tank Fuel & Highway Tolls'),
        (450.00, 'expense', '2026-07-06', 'Utilities & Bills', '1Gbps Fiber Internet, Water & Electricity'),
        (290.00, 'expense', '2026-07-08', 'Entertainment & Subscriptions', 'ChatGPT Pro, Midjourney, Netflix & Spotify'),
        (950.00, 'expense', '2026-07-12', 'Shopping & Lifestyle', 'Dual 4K Monitor Setup & Workspace Gear'),
        (480.00, 'expense', '2026-07-15', 'Food & Dining', 'Fine Dining Experience at Waterfront Restaurant'),
        (220.00, 'expense', '2026-07-18', 'Health & Wellness', 'Fitness Club & Sauna Monthly Pass'),
    ]
    for amt, t, d, c, desc in txs:
        Transaction.objects.get_or_create(
            user=user, date=d, category=c, amount=amt,
            defaults={'type': t, 'description': desc}
        )

    assets = [
        ('Apple Inc.', 'AAPL', 'Stocks', 225.50, 60, 170.00, '2024-01-15'),
        ('NVIDIA Corp', 'NVDA', 'Stocks', 850.00, 20, 420.00, '2023-10-10'),
        ('Tesla Motors', 'TSLA', 'Stocks', 305.15, 35, 205.00, '2024-03-10'),
        ('Microsoft Corp', 'MSFT', 'Stocks', 445.20, 25, 375.00, '2024-02-01'),
        ('Vanguard S&P 500 ETF', 'VOO', 'Stocks', 480.00, 50, 400.00, '2023-08-12'),
        ('Bitcoin', 'BTC', 'Cryptocurrency', 67500.00, 1.0, 45000.00, '2023-11-20'),
        ('Ethereum', 'ETH', 'Cryptocurrency', 3450.00, 6.0, 2500.00, '2024-02-05'),
        ('Solana', 'SOL', 'Cryptocurrency', 175.80, 50.0, 90.00, '2023-12-15'),
        ('Physical Gold Bullion', 'GOLD', 'Gold & Precious Metals', 2420.00, 10.0, 1950.00, '2023-05-18'),
    ]
    for name, sym, atype, cur_p, qty, pur_p, pur_d in assets:
        asset_obj, _ = PortfolioAsset.objects.get_or_create(
            user=user, symbol=sym,
            defaults={
                'name': name, 'asset_type': atype,
                'current_price': cur_p, 'quantity': qty,
                'purchase_price': pur_p, 'purchase_date': pur_d
            }
        )
        if not PortfolioHistory.objects.filter(user=user, asset=asset_obj, price=cur_p).exists():
            PortfolioHistory.objects.create(user=user, asset=asset_obj, price=cur_p)

    events = [
        ('Japan Tech Expedition 2026', '2026-09-01', '2026-09-12', 5000.00),
        ('Paris Fashion & Design Week', '2026-10-15', '2026-10-22', 3200.00),
    ]
    for ename, sd, ed, b in events:
        event_obj, _ = Event.objects.get_or_create(
            user=user, name=ename,
            defaults={'start_date': sd, 'end_date': ed, 'budget': b}
        )
        EventTransaction.objects.get_or_create(
            user=user, event=event_obj, amount=750.00, date='2026-07-15',
            defaults={'category': 'Flights', 'description': 'ANA Business Class Flight Booking'}
        )

def setup_standard_data(user):
    Budget.objects.get_or_create(user=user, defaults={'monthly_budget': 5000.00})

if __name__ == '__main__':
    seed()
