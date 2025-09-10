from django.urls import path

from . import views

urlpatterns = [
    path("register",    views.register, name="register"),
    path("connect",     views.connect,  name="connect"),
    path("42auth",      views.oauth,    name="42auth")
]
