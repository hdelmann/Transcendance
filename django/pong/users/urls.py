from django.urls import path
from . import views

urlpatterns = [
    path('<str:username>',             views.fetch_user,   name='fetch_user'),
    path('<str:username>/avatar',      views.fetch_avatar, name='fetch_user_avatar'),
    path('<str:username>/set_avatar',  views.set_avatar,   name='set_user_avatar')
]
