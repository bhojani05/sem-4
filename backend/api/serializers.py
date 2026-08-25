import re
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Transaction, PortfolioAsset, PortfolioHistory,
    Budget, CategoryBudget, Event, EventTransaction
)

class UserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='first_name', required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'name', 'is_staff', 'date_joined']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    name = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'name']

    def validate_username(self, value):
        if not re.match(r'^[a-zA-Z0-9_]{3,20}$', value):
            raise serializers.ValidationError(
                "Username must be 3-20 characters long and contain only letters, numbers, and underscores."
            )
        return value

    def validate_password(self, value):
        # First character uppercase, min 8 chars, contains at least 1 number & 1 special char
        pattern = r'^(?=[A-Z])(?=.*[0-9])(?=.*[@#$%^&*!._-]).{8,50}$'
        if not re.match(pattern, value):
            raise serializers.ValidationError(
                "Password must start with an uppercase letter, be at least 8 characters long, and contain at least one number and one special character (e.g. Nisu@2026)."
            )
        return value

    def create(self, validated_data):
        from decimal import Decimal
        from django.utils import timezone
        username = validated_data.get('username') or validated_data.get('email')
        name = validated_data.get('name', '')
        user = User.objects.create_user(
            username=username,
            email=validated_data.get('email'),
            password=validated_data.get('password'),
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
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)

    def validate_new_password(self, value):
        pattern = r'^(?=[A-Z])(?=.*[0-9])(?=.*[@#$%^&*!._-]).{8,50}$'
        if not re.match(pattern, value):
            raise serializers.ValidationError(
                "Password must start with an uppercase letter, be at least 8 characters long, and contain at least one number and one special character (e.g. Nisu@2026)."
            )
        return value


class TransactionSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Transaction
        fields = ['id', 'user', 'amount', 'type', 'date', 'category', 'description', 'created_at']


class PortfolioAssetSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = PortfolioAsset
        fields = [
            'id', 'user', 'name', 'symbol', 'asset_type', 'current_price',
            'quantity', 'purchase_price', 'purchase_date', 'total_value',
            'total_cost', 'unrealized_pl', 'unrealized_pl_percent',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['total_value', 'total_cost', 'unrealized_pl', 'unrealized_pl_percent']


class PortfolioHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioHistory
        fields = ['id', 'asset', 'price', 'date_recorded']


class BudgetSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    spent_amount = serializers.SerializerMethodField()
    remaining_amount = serializers.SerializerMethodField()
    percentage_used = serializers.SerializerMethodField()

    class Meta:
        model = Budget
        fields = ['id', 'user', 'monthly_budget', 'spent_amount', 'remaining_amount', 'percentage_used', 'created_at']

    def get_spent_amount(self, obj):
        from django.utils import timezone
        from django.db.models import Sum
        now = timezone.now()
        spent = obj.user.transactions.filter(
            type='expense',
            date__year=now.year,
            date__month=now.month
        ).aggregate(Sum('amount'))['amount__sum']
        return float(spent or 0)

    def get_remaining_amount(self, obj):
        limit = float(obj.monthly_budget or 0)
        spent = self.get_spent_amount(obj)
        return float(round(limit - spent, 2))

    def get_percentage_used(self, obj):
        limit = float(obj.monthly_budget or 0)
        if limit <= 0:
            return 0
        spent = self.get_spent_amount(obj)
        return float(round((spent / limit) * 100, 1))


class CategoryBudgetSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    spent_amount = serializers.SerializerMethodField()
    remaining_amount = serializers.SerializerMethodField()
    percentage_used = serializers.SerializerMethodField()
    is_exceeded = serializers.SerializerMethodField()

    class Meta:
        model = CategoryBudget
        fields = [
            'id', 'user', 'category', 'monthly_budget',
            'spent_amount', 'remaining_amount', 'percentage_used', 'is_exceeded',
            'created_at', 'updated_at'
        ]

    def get_spent_amount(self, obj):
        from django.utils import timezone
        from django.db.models import Sum
        now = timezone.now()
        spent = obj.user.transactions.filter(
            type='expense',
            category__iexact=obj.category,
            date__year=now.year,
            date__month=now.month
        ).aggregate(Sum('amount'))['amount__sum']
        return float(spent or 0)

    def get_remaining_amount(self, obj):
        limit = float(obj.monthly_budget or 0)
        spent = self.get_spent_amount(obj)
        return float(round(limit - spent, 2))

    def get_percentage_used(self, obj):
        limit = float(obj.monthly_budget or 0)
        if limit <= 0:
            return 0
        spent = self.get_spent_amount(obj)
        return float(round((spent / limit) * 100, 1))

    def get_is_exceeded(self, obj):
        limit = float(obj.monthly_budget or 0)
        spent = self.get_spent_amount(obj)
        return spent > limit


class EventTransactionSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = EventTransaction
        fields = ['id', 'user', 'event', 'amount', 'type', 'date', 'category', 'description', 'created_at']


class EventSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    event_transactions = EventTransactionSerializer(source='transactions', many=True, read_only=True)
    total_spent = serializers.SerializerMethodField()
    budget = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)

    class Meta:
        model = Event
        fields = [
            'id', 'user', 'name', 'start_date', 'end_date', 'budget',
            'exclude_from_main_budget', 'created_at', 'event_transactions', 'total_spent'
        ]

    def get_total_spent(self, obj):
        expenses = obj.transactions.filter(type='expense')
        return sum(item.amount for item in expenses)
