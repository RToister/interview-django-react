from django.urls import path

from .views import MeView, RegisterView, TokenView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("token/", TokenView.as_view(), name="token"),
    path("me/", MeView.as_view(), name="me"),
]
