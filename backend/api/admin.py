from django.contrib import admin
from .models import (
    Transaction, PortfolioAsset, PortfolioHistory,
    Budget, CategoryBudget, Event, EventTransaction
)

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'type', 'amount', 'category', 'date', 'created_at')
    list_filter = ('type', 'category', 'date')
    search_fields = ('user__username', 'category', 'description')

@admin.register(PortfolioAsset)
class PortfolioAssetAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'name', 'symbol', 'asset_type', 'current_price', 'quantity', 'total_value', 'unrealized_pl')
    list_filter = ('asset_type',)
    search_fields = ('user__username', 'name', 'symbol')

@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'monthly_budget', 'created_at')

@admin.register(CategoryBudget)
class CategoryBudgetAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'category', 'monthly_budget')

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'name', 'start_date', 'end_date', 'budget')

@admin.register(EventTransaction)
class EventTransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'event', 'type', 'amount', 'date')
