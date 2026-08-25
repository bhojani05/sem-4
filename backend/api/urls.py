from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import (
    RegisterView, CurrentUserView, ChangePasswordView, SendOTPView,
    VerifyOTPAndRegisterView, FetchLivePriceView, MarketCatalogView,
    AdminSystemStatsView, AdminToggleStaffView, AdminUserSummaryView,
    AdminResetPasswordView, AdminDeleteUserView,
    TransactionViewSet, PortfolioAssetViewSet, BudgetViewSet,
    CategoryBudgetViewSet, EventViewSet, EventTransactionViewSet,
    DashboardStatsView, ReportsStatsView, AdminUsersView
)

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'portfolio', PortfolioAssetViewSet, basename='portfolio')
router.register(r'budgets', BudgetViewSet, basename='budget')
router.register(r'category-budgets', CategoryBudgetViewSet, basename='category-budget')
router.register(r'events', EventViewSet, basename='event')
router.register(r'event-transactions', EventTransactionViewSet, basename='event-transaction')

urlpatterns = [
    path('auth/send_otp/', SendOTPView.as_view(), name='auth_send_otp'),
    path('auth/verify_otp/', VerifyOTPAndRegisterView.as_view(), name='auth_verify_otp'),
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', CurrentUserView.as_view(), name='auth_me'),
    path('auth/change_password/', ChangePasswordView.as_view(), name='auth_change_password'),
    
    path('portfolio/market_catalog/', MarketCatalogView.as_view(), name='portfolio_market_catalog'),
    path('portfolio/fetch_price/', FetchLivePriceView.as_view(), name='portfolio_fetch_price'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('reports/stats/', ReportsStatsView.as_view(), name='reports_stats'),
    
    # Enterprise Admin Routes
    path('admin/stats/', AdminSystemStatsView.as_view(), name='admin_system_stats'),
    path('admin/users/', AdminUsersView.as_view(), name='admin_users'),
    path('admin/users/<int:user_id>/toggle_admin/', AdminToggleStaffView.as_view(), name='admin_toggle_staff'),
    path('admin/users/<int:user_id>/user_summary/', AdminUserSummaryView.as_view(), name='admin_user_summary'),
    path('admin/users/<int:user_id>/reset_password/', AdminResetPasswordView.as_view(), name='admin_reset_password'),
    path('admin/users/<int:user_id>/', AdminDeleteUserView.as_view(), name='admin_delete_user'),
    
    path('', include(router.urls)),
]
