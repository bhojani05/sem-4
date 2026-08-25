from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Transaction(models.Model):
    TRANSACTION_TYPES = (
        ('income', 'Income'),
        ('expense', 'Expense'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    date = models.DateField()
    category = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.type.upper()} ${self.amount} ({self.category})"


class PortfolioAsset(models.Model):
    ASSET_TYPES = (
        ('Stocks', 'Stocks'),
        ('Bonds', 'Bonds'),
        ('Cryptocurrency', 'Cryptocurrency'),
        ('Real Estate', 'Real Estate'),
        ('Gold & Precious Metals', 'Gold & Precious Metals'),
        ('Cash & Savings', 'Cash & Savings'),
        ('Vehicle', 'Vehicle'),
        ('Other', 'Other'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='portfolio_assets')
    name = models.CharField(max_length=100)
    symbol = models.CharField(max_length=20)
    asset_type = models.CharField(max_length=30, choices=ASSET_TYPES)
    current_price = models.DecimalField(max_digits=15, decimal_places=4)
    quantity = models.DecimalField(max_digits=15, decimal_places=8)
    purchase_price = models.DecimalField(max_digits=15, decimal_places=4)
    purchase_date = models.DateField()
    total_value = models.DecimalField(max_digits=20, decimal_places=4, default=0)
    total_cost = models.DecimalField(max_digits=20, decimal_places=4, default=0)
    unrealized_pl = models.DecimalField(max_digits=20, decimal_places=4, default=0)
    unrealized_pl_percent = models.DecimalField(max_digits=10, decimal_places=4, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        self.total_value = self.current_price * self.quantity
        self.total_cost = self.purchase_price * self.quantity
        self.unrealized_pl = self.total_value - self.total_cost
        if self.total_cost > 0:
            self.unrealized_pl_percent = (self.unrealized_pl / self.total_cost) * 100
        else:
            self.unrealized_pl_percent = 0
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.symbol} ({self.name})"


class PortfolioHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='portfolio_history')
    asset = models.ForeignKey(PortfolioAsset, on_delete=models.CASCADE, related_name='history')
    price = models.DecimalField(max_digits=15, decimal_places=4)
    date_recorded = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_recorded']


class Budget(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='budget')
    monthly_budget = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} Monthly Budget: ${self.monthly_budget}"


class CategoryBudget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='category_budgets')
    category = models.CharField(max_length=50)
    monthly_budget = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'category')

    def __str__(self):
        return f"{self.user.username} - {self.category}: ${self.monthly_budget}"


class Event(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='events')
    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    exclude_from_main_budget = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - Event: {self.name}"


class EventTransaction(models.Model):
    TRANSACTION_TYPES = (
        ('income', 'Income'),
        ('expense', 'Expense'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='event_transactions')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    date = models.DateField()
    category = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.event.name} - {self.type.upper()} ${self.amount}"


class EmailOTP(models.Model):
    email = models.EmailField()
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_verified = models.BooleanField(default=False)

    def is_valid(self):
        return not self.is_verified and timezone.now() <= self.expires_at

    def __str__(self):
        return f"{self.email} - {self.otp_code} (Expires: {self.expires_at})"
