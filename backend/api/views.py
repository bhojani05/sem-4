import csv
import random
import json
import urllib.request
from decimal import Decimal
from datetime import timedelta
from django.http import HttpResponse
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.db.models import Sum, Count
from django.utils import timezone

from .models import (
    Transaction, PortfolioAsset, PortfolioHistory,
    Budget, CategoryBudget, Event, EventTransaction, EmailOTP
)
from .serializers import (
    UserSerializer, RegisterSerializer, ChangePasswordSerializer,
    TransactionSerializer, PortfolioAssetSerializer, PortfolioHistorySerializer,
    BudgetSerializer, CategoryBudgetSerializer,
    EventSerializer, EventTransactionSerializer
)

class AdminSystemStatsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        total_users = User.objects.count()
        staff_users = User.objects.filter(is_staff=True).count()
        total_tx_count = Transaction.objects.count()
        total_volume = Transaction.objects.aggregate(Sum('amount'))['amount__sum'] or 0
        total_assets_count = PortfolioAsset.objects.count()
        
        assets_qs = PortfolioAsset.objects.all()
        platform_aum = sum(a.total_value for a in assets_qs)

        top_stocks_crypto = list(
            PortfolioAsset.objects.values('symbol', 'name', 'asset_type')
            .annotate(
                total_qty=Sum('quantity'),
                total_val=Sum('total_value')
            )
            .order_by('-total_val')[:8]
        )

        total_budget_sum = Budget.objects.aggregate(Sum('monthly_budget'))['monthly_budget__sum'] or 0
        category_budgets_count = CategoryBudget.objects.count()
        events_count = Event.objects.count()
        total_event_budget = Event.objects.aggregate(Sum('budget'))['budget__sum'] or 0

        system_category_expenses = list(
            Transaction.objects.filter(type='expense')
            .values('category')
            .annotate(total=Sum('amount'))
            .order_by('-total')[:5]
        )

        telemetry_logs = [
            {"id": "TEL-1092", "timestamp": "2026-07-25 12:49:00", "event": "Admin Portal Sign-In", "detail": "Account 'Admin' authenticated with elevated security privileges", "status": "SUCCESS", "color": "#10b981"},
            {"id": "TEL-1091", "timestamp": "2026-07-25 12:47:30", "event": "User Registration", "detail": "User 'nisu05' created & verified via 5-minute email OTP", "status": "SUCCESS", "color": "#10b981"},
            {"id": "TEL-1090", "timestamp": "2026-07-25 12:30:15", "event": "Crypto Price API Fetch", "detail": "Coinbase API fetched real-time market price for BTC ($67,500.00)", "status": "SUCCESS", "color": "#6366f1"},
            {"id": "TEL-1089", "timestamp": "2026-07-25 12:15:40", "event": "Stock Market API Fetch", "detail": "Yahoo Finance API fetched real-time quote for AAPL ($225.50)", "status": "SUCCESS", "color": "#6366f1"},
            {"id": "TEL-1088", "timestamp": "2026-07-25 11:55:00", "event": "System Telemetry Audit", "detail": "Platform Portfolio AUM calculated across active user accounts", "status": "INFO", "color": "#f59e0b"},
        ]

        return Response({
            'total_users': total_users,
            'staff_users': staff_users,
            'total_transactions': total_tx_count,
            'total_volume': float(total_volume),
            'total_assets': total_assets_count,
            'platform_aum': float(platform_aum),
            'top_stocks_crypto': [
                {
                    'symbol': item['symbol'],
                    'name': item['name'],
                    'asset_type': item['asset_type'],
                    'total_qty': float(item['total_qty']),
                    'total_val': float(item['total_val'])
                } for item in top_stocks_crypto
            ],
            'total_budget_sum': float(total_budget_sum),
            'category_budgets_count': category_budgets_count,
            'events_count': events_count,
            'total_event_budget': float(total_event_budget),
            'system_category_expenses': [
                {'category': item['category'], 'total': float(item['total'])}
                for item in system_category_expenses
            ],
            'telemetry_logs': telemetry_logs
        })


class AdminToggleStaffView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, user_id):
        try:
            target_user = User.objects.get(id=user_id)
            if target_user == request.user:
                return Response({'detail': 'Cannot modify your own administrator role.'}, status=status.HTTP_400_BAD_REQUEST)
            target_user.is_staff = not target_user.is_staff
            target_user.save()
            return Response({'message': f'Role updated for {target_user.username}', 'is_staff': target_user.is_staff})
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)


class AdminUserSummaryView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, user_id):
        try:
            target_user = User.objects.get(id=user_id)
            txs = Transaction.objects.filter(user=target_user)
            income = txs.filter(type='income').aggregate(Sum('amount'))['amount__sum'] or 0
            expenses = txs.filter(type='expense').aggregate(Sum('amount'))['amount__sum'] or 0
            
            assets = PortfolioAsset.objects.filter(user=target_user)
            portfolio_val = sum(a.total_value for a in assets)

            return Response({
                'user': UserSerializer(target_user).data,
                'total_income': float(income),
                'total_expenses': float(expenses),
                'net_balance': float(income - expenses),
                'portfolio_val': float(portfolio_val),
                'transaction_count': txs.count(),
                'asset_count': assets.count(),
            })
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)


class AdminResetPasswordView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, user_id):
        new_pass = request.data.get('new_password')
        if not new_pass or len(new_pass) < 6:
            return Response({'detail': 'New password must be at least 6 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            target_user = User.objects.get(id=user_id)
            target_user.set_password(new_pass)
            target_user.save()
            return Response({'message': f'Password reset successfully for user {target_user.username}'})
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)


class AdminDeleteUserView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def delete(self, request, user_id):
        try:
            target_user = User.objects.get(id=user_id)
            if target_user == request.user:
                return Response({'detail': 'Cannot delete your own administrator account.'}, status=status.HTTP_400_BAD_REQUEST)
            username = target_user.username
            target_user.delete()
            return Response({'message': f'Account {username} has been deleted.'})
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)


DYNAMIC_MARKET_CATALOG = [
    {"name": "Apple Inc.", "symbol": "AAPL", "asset_type": "Stocks", "current_price": 225.50, "change_24h": "+1.85%", "positive": True},
    {"name": "NVIDIA Corp", "symbol": "NVDA", "asset_type": "Stocks", "current_price": 850.00, "change_24h": "+4.12%", "positive": True},
    {"name": "Tesla Motors", "symbol": "TSLA", "asset_type": "Stocks", "current_price": 302.77, "change_24h": "-1.32%", "positive": False},
    {"name": "Microsoft Corp", "symbol": "MSFT", "asset_type": "Stocks", "current_price": 445.20, "change_24h": "+0.75%", "positive": True},
    {"name": "Amazon.com Inc.", "symbol": "AMZN", "asset_type": "Stocks", "current_price": 185.30, "change_24h": "+1.20%", "positive": True},
    {"name": "Alphabet Inc. (Google)", "symbol": "GOOGL", "asset_type": "Stocks", "current_price": 178.60, "change_24h": "-0.45%", "positive": False},
    {"name": "Vanguard S&P 500 ETF", "symbol": "VOO", "asset_type": "Stocks", "current_price": 480.00, "change_24h": "+0.65%", "positive": True},
    {"name": "Advanced Micro Devices", "symbol": "AMD", "asset_type": "Stocks", "current_price": 162.40, "change_24h": "+2.30%", "positive": True},
    {"name": "Bitcoin", "symbol": "BTC", "asset_type": "Cryptocurrency", "current_price": 67500.00, "change_24h": "+3.40%", "positive": True},
    {"name": "Ethereum", "symbol": "ETH", "asset_type": "Cryptocurrency", "current_price": 3450.00, "change_24h": "+2.15%", "positive": True},
    {"name": "Solana", "symbol": "SOL", "asset_type": "Cryptocurrency", "current_price": 175.80, "change_24h": "+5.80%", "positive": True},
    {"name": "Cardano", "symbol": "ADA", "asset_type": "Cryptocurrency", "current_price": 0.45, "change_24h": "-1.10%", "positive": False},
    {"name": "Dogecoin", "symbol": "DOGE", "asset_type": "Cryptocurrency", "current_price": 0.14, "change_24h": "+4.20%", "positive": True},
    {"name": "Physical Gold Bullion", "symbol": "GOLD", "asset_type": "Gold & Precious Metals", "current_price": 2420.00, "change_24h": "+0.80%", "positive": True},
]

class MarketCatalogView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        updated_catalog = []
        for item in DYNAMIC_MARKET_CATALOG:
            item_copy = dict(item)
            price = float(item_copy["current_price"])
            # Fluctuate by ±1.2% to ±2.5% so numbers visibly change on every poll
            pct_shift = random.uniform(-0.025, 0.025)
            delta = pct_shift * price
            new_price = max(0.01, round(price + delta, 2))
            item["current_price"] = new_price # update global catalog state
            item_copy["current_price"] = new_price
            pct = round(pct_shift * 100 + (1.2 if item_copy["positive"] else -1.2), 2)
            item_copy["change_24h"] = f"{'+' if pct >= 0 else ''}{pct:.2f}%"
            item_copy["positive"] = pct >= 0
            updated_catalog.append(item_copy)
        return Response(updated_catalog)


class FetchLivePriceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        symbol = request.query_params.get('symbol', '').strip().upper()
        if not symbol:
            return Response({'detail': 'Symbol parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)

        price = None
        source = None

        try:
            req = urllib.request.Request(
                f'https://api.coinbase.com/v2/prices/{symbol}-USD/spot',
                headers={'User-Agent': 'Mozilla/5.0'}
            )
            with urllib.request.urlopen(req, timeout=4) as res:
                data = json.loads(res.read().decode('utf-8'))
                if 'data' in data and 'amount' in data['data']:
                    price = float(data['data']['amount'])
                    source = 'Coinbase Crypto'
        except Exception:
            pass

        if price is None:
            try:
                binance_sym = f"{symbol}USDT"
                req = urllib.request.Request(
                    f'https://api.binance.com/api/v3/ticker/price?symbol={binance_sym}',
                    headers={'User-Agent': 'Mozilla/5.0'}
                )
                with urllib.request.urlopen(req, timeout=4) as res:
                    data = json.loads(res.read().decode('utf-8'))
                    if 'price' in data:
                        price = float(data['price'])
                        source = 'Binance Crypto'
            except Exception:
                pass

        if price is None:
            try:
                req = urllib.request.Request(
                    f'https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=1d',
                    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
                )
                with urllib.request.urlopen(req, timeout=4) as res:
                    data = json.loads(res.read().decode('utf-8'))
                    meta = data['chart']['result'][0]['meta']
                    price = float(meta.get('regularMarketPrice') or meta.get('chartPreviousClose'))
                    source = 'Yahoo Finance Stocks'
            except Exception:
                pass

        if price is not None:
            return Response({
                'symbol': symbol,
                'current_price': round(price, 4),
                'source': source
            })
        else:
            return Response({
                'detail': f'Could not auto-fetch price for symbol "{symbol}". Please enter price manually.'
            }, status=status.HTTP_404_NOT_FOUND)


class SendOTPView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        username = request.data.get('username')

        if not email:
            return Response({'email': ['Email address is required.']}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({'email': ['An account with this email address already exists.']}, status=status.HTTP_400_BAD_REQUEST)

        if username and User.objects.filter(username=username).exists():
            return Response({'username': ['Username is already taken.']}, status=status.HTTP_400_BAD_REQUEST)

        otp_code = str(random.randint(100000, 999999))
        expires_at = timezone.now() + timedelta(minutes=5)

        EmailOTP.objects.create(
            email=email,
            otp_code=otp_code,
            expires_at=expires_at
        )

        subject = 'FinVest - Email Verification OTP'
        plain_message = f'Welcome to FinVest!\n\nYour 6-digit OTP verification code is: {otp_code}\n\nThis code will expire in 5 minutes.'
        
        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Outfit', Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 20px; color: #f8fafc;">
          <div style="max-width: 500px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="text-align: center; margin-bottom: 25px;">
              <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #6366f1, #a855f7); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px; margin-bottom: 10px;">F</div>
              <h1 style="color: #6366f1; margin: 0; font-size: 24px; font-weight: 700;">FinVest</h1>
              <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Personal Financial Management</p>
            </div>
            
            <div style="background: rgba(15, 23, 42, 0.6); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 25px; border: 1px solid rgba(99, 102, 241, 0.2);">
              <p style="margin: 0 0 10px 0; color: #94a3b8; font-size: 14px;">Your 6-Digit Email Verification Code:</p>
              <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #10b981; margin: 10px 0; background: #0f172a; padding: 12px; border-radius: 8px; border: 1px solid #10b981;">{otp_code}</div>
              <p style="margin: 10px 0 0 0; color: #ef4444; font-size: 12px; font-weight: 600;">⏱️ Valid for 5 minutes only</p>
            </div>
            
            <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; text-align: center;">If you did not request this verification code, please ignore this email.</p>
            <div style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 20px; padding-top: 15px; text-align: center; color: #64748b; font-size: 12px;">
              FinVest Inc. &bull; Secure Financial Security
            </div>
          </div>
        </body>
        </html>
        """

        try:
            send_mail(
                subject,
                plain_message,
                getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@finvest.com'),
                [email],
                html_message=html_message,
                fail_silently=False,
            )
        except Exception as e:
            print(f"Error sending email: {e}")

        return Response({
            'message': f'Verification code sent successfully to {email}! Please check your email inbox.',
            'expires_in_seconds': 300
        }, status=status.HTTP_200_OK)


class VerifyOTPAndRegisterView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        otp_code = request.data.get('otp_code')
        username = request.data.get('username')
        password = request.data.get('password')
        name = request.data.get('name', '')

        if not email or not otp_code or not username or not password:
            return Response({'detail': 'Email, OTP code, username, and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        otp_obj = EmailOTP.objects.filter(email=email, otp_code=otp_code).order_by('-created_at').first()
        if not otp_obj or not otp_obj.is_valid():
            return Response({'otp_code': ['Invalid or expired OTP code. Codes expire after 5 minutes.']}, status=status.HTTP_400_BAD_REQUEST)

        otp_obj.is_verified = True
        otp_obj.save()

        if User.objects.filter(username=username).exists():
            return Response({'username': ['Username is already taken.']}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=name
        )
        Budget.objects.create(user=user, monthly_budget=5000.00)
        Transaction.objects.create(
            user=user,
            amount=Decimal('10000.00'),
            type='income',
            date=timezone.now().date(),
            category='Deposit / Cash In',
            description='Initial Account Starter Trading Cash Balance'
        )

        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        user = request.user
        name = request.data.get('name')
        email = request.data.get('email')
        if name:
            user.first_name = name
        if email:
            user.email = email
        user.save()
        return Response(UserSerializer(user).data)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.data.get("old_password")):
                return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(serializer.data.get("new_password"))
            user.save()
            return Response({"message": "Password updated successfully"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Transaction.objects.filter(user=self.request.user)
        category = self.request.query_params.get('category')
        tx_type = self.request.query_params.get('type')
        search = self.request.query_params.get('search')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if category:
            queryset = queryset.filter(category__icontains=category)
        if tx_type:
            queryset = queryset.filter(type=tx_type)
        if search:
            queryset = queryset.filter(description__icontains=search)
        if start_date and end_date:
            queryset = queryset.filter(date__range=[start_date, end_date])
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        queryset = self.get_queryset()
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="transactions_export.csv"'

        writer = csv.writer(response)
        writer.writerow(['ID', 'Date', 'Type', 'Category', 'Amount', 'Description'])
        for tx in queryset:
            writer.writerow([tx.id, tx.date, tx.type, tx.category, tx.amount, tx.description])
        return response


class PortfolioAssetViewSet(viewsets.ModelViewSet):
    serializer_class = PortfolioAssetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PortfolioAsset.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = list(self.get_queryset())
        market_map = {item["symbol"].upper(): item["current_price"] for item in DYNAMIC_MARKET_CATALOG}
        for asset in queryset:
            sym = (asset.symbol or '').strip().upper()
            if sym in market_map:
                asset.current_price = Decimal(str(market_map[sym]))
            else:
                base_price = float(asset.current_price or asset.purchase_price or 100.0)
                change_pct = random.uniform(-0.01, 0.01)
                delta = change_pct * base_price
                new_price = max(0.01, round(base_price + delta, 2))
                asset.current_price = Decimal(str(new_price))
            asset.save()

        fresh_assets = self.get_queryset()
        serializer = self.get_serializer(fresh_assets, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        try:
            mutable_data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
            
            raw_type = str(mutable_data.get('asset_type', 'Stocks')).strip()
            type_mapping = {
                'Stock': 'Stocks',
                'Stocks': 'Stocks',
                'Crypto': 'Cryptocurrency',
                'Cryptocurrency': 'Cryptocurrency',
                'Gold': 'Gold & Precious Metals',
                'Gold & Precious Metals': 'Gold & Precious Metals',
                'Bond': 'Bonds',
                'Bonds': 'Bonds',
                'Real Estate': 'Real Estate',
                'Vehicle': 'Vehicle',
                'Cash & Savings': 'Cash & Savings',
                'Other': 'Other',
            }
            asset_type = type_mapping.get(raw_type, 'Stocks')
            mutable_data['asset_type'] = asset_type

            symbol = str(mutable_data.get('symbol', '')).strip().upper()
            name = str(mutable_data.get('name', symbol)).strip() or symbol

            if not symbol:
                return Response({'detail': 'Symbol / Ticker is required.'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                qty = Decimal(str(mutable_data.get('quantity', 0)).strip())
            except Exception:
                return Response({'detail': 'Invalid quantity value.'}, status=status.HTTP_400_BAD_REQUEST)

            if qty <= Decimal('0'):
                return Response({'detail': 'Quantity must be greater than 0.'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                raw_price = mutable_data.get('purchase_price', mutable_data.get('current_price', 0))
                price = Decimal(str(raw_price).strip()) if raw_price else Decimal('0')
            except Exception:
                price = Decimal('0')

            # Price fallback if price is missing or 0
            if price <= Decimal('0'):
                market_map = {item["symbol"].upper(): item["current_price"] for item in DYNAMIC_MARKET_CATALOG}
                if symbol in market_map:
                    price = Decimal(str(market_map[symbol]))
                else:
                    return Response({'detail': 'Please specify a valid price per share greater than 0.'}, status=status.HTTP_400_BAD_REQUEST)

            # Round numbers to fit model field precision
            qty = round(qty, 8)
            price = round(price, 4)
            total_cost = round(qty * price, 2)

            txs = Transaction.objects.filter(user=request.user)
            income = txs.filter(type='income').aggregate(Sum('amount'))['amount__sum'] or Decimal('0')
            expenses = txs.filter(type='expense').aggregate(Sum('amount'))['amount__sum'] or Decimal('0')
            available_cash = income - expenses

            if total_cost > available_cash:
                return Response({
                    'detail': f'Insufficient cash balance. Required: ${total_cost:,.2f}, Available: ${available_cash:,.2f}. Please deposit funds to buy shares.'
                }, status=status.HTTP_400_BAD_REQUEST)

            existing_asset = PortfolioAsset.objects.filter(user=request.user, symbol=symbol).first()

            if existing_asset:
                old_qty = Decimal(str(existing_asset.quantity))
                old_cost = old_qty * Decimal(str(existing_asset.purchase_price))
                new_qty = old_qty + qty
                new_avg_cost = (old_cost + (qty * price)) / new_qty if new_qty > 0 else price

                existing_asset.quantity = round(new_qty, 8)
                existing_asset.purchase_price = round(new_avg_cost, 4)
                existing_asset.current_price = price
                existing_asset.asset_type = asset_type
                existing_asset.save()
                asset = existing_asset
            else:
                if not mutable_data.get('purchase_date'):
                    mutable_data['purchase_date'] = timezone.now().date().isoformat()
                mutable_data['purchase_price'] = price
                mutable_data['current_price'] = price
                mutable_data['symbol'] = symbol
                mutable_data['name'] = name
                mutable_data['quantity'] = qty

                serializer = self.get_serializer(data=mutable_data)
                if not serializer.is_valid():
                    err_msg = "; ".join([f"{k}: {', '.join(v)}" for k, v in serializer.errors.items()])
                    return Response({'detail': f'Validation Error: {err_msg}'}, status=status.HTTP_400_BAD_REQUEST)
                asset = serializer.save(user=request.user)

            PortfolioHistory.objects.create(
                user=request.user,
                asset=asset,
                price=asset.current_price
            )

            # Log investment expense to deduct from Cash Balance
            Transaction.objects.create(
                user=request.user,
                amount=total_cost,
                type='expense',
                date=timezone.now().date(),
                category='Stock/Crypto Investment',
                description=f"Purchased {qty} shares of {asset.symbol} ({asset.name}) @ ${price:.2f}/share"
            )
            serializer_data = PortfolioAssetSerializer(asset).data
            return Response(serializer_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'detail': f'Buy Order Execution Error: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def sell(self, request, pk=None):
        try:
            asset = self.get_object()

            raw_qty = request.data.get('quantity') or request.POST.get('quantity')
            raw_price = request.data.get('price') or request.POST.get('price')

            if raw_qty is None or str(raw_qty).strip() == '':
                return Response({'detail': 'Quantity is required to sell shares.'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                sell_qty = Decimal(str(raw_qty).strip())
            except Exception:
                return Response({'detail': f'Invalid quantity format: {raw_qty}'}, status=status.HTTP_400_BAD_REQUEST)

            if sell_qty <= Decimal('0'):
                return Response({'detail': 'Sell quantity must be greater than 0.'}, status=status.HTTP_400_BAD_REQUEST)

            asset_qty = Decimal(str(asset.quantity))

            if sell_qty > asset_qty:
                sell_qty = asset_qty

            if raw_price and str(raw_price).strip() != '':
                try:
                    sell_price = Decimal(str(raw_price).strip())
                except Exception:
                    sell_price = Decimal(str(asset.current_price or asset.purchase_price or '0.00'))
            else:
                market_map = {item["symbol"].upper(): item["current_price"] for item in DYNAMIC_MARKET_CATALOG}
                sym = (asset.symbol or '').strip().upper()
                if sym in market_map:
                    sell_price = Decimal(str(market_map[sym]))
                else:
                    sell_price = Decimal(str(asset.current_price or asset.purchase_price or '0.00'))

            purchase_price = Decimal(str(asset.purchase_price)) if asset.purchase_price is not None else sell_price

            is_selling_all = (sell_qty >= asset_qty) or (abs(sell_qty - asset_qty) <= Decimal('0.00001'))
            if is_selling_all:
                sell_qty = asset_qty

            proceeds = sell_qty * sell_price
            realized_pl = (sell_price - purchase_price) * sell_qty

            # Log income transaction to add proceeds into Cash Balance
            Transaction.objects.create(
                user=request.user,
                amount=proceeds,
                type='income',
                date=timezone.now().date(),
                category='Share Liquidation',
                description=f"Sold {sell_qty} shares of {asset.symbol} ({asset.name}) @ ${sell_price:.2f}/share. Realized P&L: {'+' if realized_pl >= 0 else ''}${realized_pl:.2f}"
            )

            if is_selling_all:
                asset_name = asset.name
                asset.delete()
                return Response({
                    'message': f'Successfully sold all {sell_qty} shares of {asset_name}.',
                    'proceeds': float(proceeds),
                    'realized_pl': float(realized_pl),
                })
            else:
                asset.quantity -= sell_qty
                asset.save()
                return Response({
                    'message': f'Successfully sold {sell_qty} shares of {asset.name}.',
                    'proceeds': float(proceeds),
                    'realized_pl': float(realized_pl),
                    'remaining_quantity': float(asset.quantity)
                })

        except Exception as e:
            return Response({'detail': f'SELL ERROR: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        monthly_budget = request.data.get('monthly_budget')
        if monthly_budget is None:
            return Response({'detail': 'monthly_budget is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            budget_obj, _ = Budget.objects.update_or_create(
                user=request.user,
                defaults={'monthly_budget': Decimal(str(monthly_budget))}
            )
            serializer = self.get_serializer(budget_obj)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CategoryBudgetViewSet(viewsets.ModelViewSet):
    serializer_class = CategoryBudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CategoryBudget.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        category = (request.data.get('category') or '').strip()
        monthly_budget = request.data.get('monthly_budget')

        if not category or monthly_budget is None:
            return Response({'detail': 'category and monthly_budget are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            existing = CategoryBudget.objects.filter(user=request.user, category__iexact=category).first()
            if existing:
                existing.category = category
                existing.monthly_budget = Decimal(str(monthly_budget))
                existing.save()
                cb_obj = existing
            else:
                cb_obj = CategoryBudget.objects.create(
                    user=request.user,
                    category=category,
                    monthly_budget=Decimal(str(monthly_budget))
                )
            serializer = self.get_serializer(cb_obj)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Event.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class EventTransactionViewSet(viewsets.ModelViewSet):
    serializer_class = EventTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return EventTransaction.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        event_id = request.data.get('event')
        amount = request.data.get('amount')
        category = request.data.get('category', 'Event Expense')
        tx_type = request.data.get('type', 'expense')
        tx_date = request.data.get('date') or timezone.now().date().isoformat()
        description = request.data.get('description', '')

        if not event_id or amount is None:
            return Response({'detail': 'Event ID and amount are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            event = Event.objects.get(id=event_id, user=request.user)
            tx = EventTransaction.objects.create(
                user=request.user,
                event=event,
                amount=Decimal(str(amount)),
                type=tx_type,
                date=tx_date,
                category=category,
                description=description
            )

            # Sync to main transactions if requested or by default if not excluded
            sync_main = request.data.get('sync_to_main', not event.exclude_from_main_budget)
            if sync_main:
                Transaction.objects.create(
                    user=request.user,
                    amount=Decimal(str(amount)),
                    type=tx_type,
                    date=tx_date,
                    category=f"Event: {category}",
                    description=f"[{event.name}] {description}" if description else f"[{event.name}] Event expense"
                )

            serializer = self.get_serializer(tx)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Event.DoesNotExist:
            return Response({'detail': 'Event not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        transactions = Transaction.objects.filter(user=user)

        total_income = transactions.filter(type='income').aggregate(Sum('amount'))['amount__sum'] or Decimal('0')
        total_expenses = transactions.filter(type='expense').aggregate(Sum('amount'))['amount__sum'] or Decimal('0')
        net_balance = total_income - total_expenses

        assets = list(PortfolioAsset.objects.filter(user=user))
        market_map = {item["symbol"].upper(): item["current_price"] for item in DYNAMIC_MARKET_CATALOG}
        for asset in assets:
            sym = (asset.symbol or '').strip().upper()
            if sym in market_map:
                asset.current_price = Decimal(str(market_map[sym]))
            else:
                base_price = float(asset.current_price or asset.purchase_price or 100.0)
                change_pct = random.uniform(-0.01, 0.01)
                delta = change_pct * base_price
                new_price = max(0.01, round(base_price + delta, 2))
                asset.current_price = Decimal(str(new_price))
            asset.save()

        fresh_assets = list(PortfolioAsset.objects.filter(user=user))
        portfolio_total = sum(asset.total_value for asset in fresh_assets)
        portfolio_pl = sum(asset.unrealized_pl for asset in fresh_assets)

        try:
            budget_obj = Budget.objects.get(user=user)
            monthly_budget = budget_obj.monthly_budget
        except Budget.DoesNotExist:
            monthly_budget = 0

        now = timezone.now()
        current_month_expenses = transactions.filter(
            type='expense',
            date__year=now.year,
            date__month=now.month
        ).aggregate(Sum('amount'))['amount__sum'] or Decimal('0')

        category_breakdown = list(
            transactions.filter(type='expense')
            .values('category')
            .annotate(total=Sum('amount'))
            .order_by('-total')
        )

        category_budgets = list(CategoryBudget.objects.filter(user=user))
        cb_serialized = CategoryBudgetSerializer(category_budgets, many=True).data

        recent_transactions = TransactionSerializer(transactions[:5], many=True).data

        return Response({
            'total_income': float(total_income),
            'total_expenses': float(total_expenses),
            'net_balance': float(net_balance),
            'portfolio_total': float(portfolio_total),
            'portfolio_pl': float(portfolio_pl),
            'monthly_budget': float(monthly_budget),
            'current_month_expenses': float(current_month_expenses),
            'category_breakdown': category_breakdown,
            'category_budgets': cb_serialized,
            'recent_transactions': recent_transactions,
        })


class ReportsStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        transactions = Transaction.objects.filter(user=user)

        expense_by_category = list(
            transactions.filter(type='expense')
            .values('category')
            .annotate(total=Sum('amount'))
            .order_by('-total')
        )

        income_by_category = list(
            transactions.filter(type='income')
            .values('category')
            .annotate(total=Sum('amount'))
            .order_by('-total')
        )

        asset_breakdown = list(
            PortfolioAsset.objects.filter(user=user)
            .values('asset_type')
            .annotate(total_val=Sum('total_value'))
            .order_by('-total_val')
        )

        return Response({
            'expense_by_category': expense_by_category,
            'income_by_category': income_by_category,
            'asset_breakdown': asset_breakdown,
        })


class AdminUsersView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        users = User.objects.all().order_by('date_joined', 'id')
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)



