from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from auth_app.views import RegisterView, LoginView, ProfileView, ChangePasswordView
from task_app.views import TaskViewSet

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/profile/', ProfileView.as_view(), name='profile'),
    path('api/profile/update/', ProfileView.as_view(), name='profile-update'),
    path('api/profile/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('api/', include(router.urls)),
] 