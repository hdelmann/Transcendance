from django.urls import path
from . import views

urlpatterns = [
    path('create', views.create, name='create'),
    path('search', views.search, name='search'),
]
