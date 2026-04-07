from django.urls import path
from .views import (DashboardView, SalesReportView, ProductPerformanceView,
                    ProfitLossView, ExportExcelView, SettingsView, LowStockView,
                    CustomerHistoryView, ExpiryTrackingView,
                    DashboardQuickStatsView, WhatsAppReminderView, BackupView, RestoreView,
                    VerifyPinView)

urlpatterns = [
    path('dashboard/', DashboardView.as_view()),
    path('sales/', SalesReportView.as_view()),
    path('products/', ProductPerformanceView.as_view()),
    path('profit-loss/', ProfitLossView.as_view()),
    path('export/', ExportExcelView.as_view()),
    path('settings/', SettingsView.as_view()),
    path('low-stock/', LowStockView.as_view()),
    path('customer-history/<int:customer_id>/', CustomerHistoryView.as_view()),
    path('expiry/', ExpiryTrackingView.as_view()),
    path('quick-stats/', DashboardQuickStatsView.as_view()),
    path('whatsapp-reminder/', WhatsAppReminderView.as_view()),
    path('backup/', BackupView.as_view()),
    path('restore/', RestoreView.as_view()),
    path('pin/', VerifyPinView.as_view()),
]
