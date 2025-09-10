from django.urls import path
from . import views

urlpatterns = [
    path('add',     views.add,              name='add_friend'),
    path('remove',  views.remove,           name='remove_friend'),
    path('',        views.list_friendships, name="list_friends"),
    path('block',   views.block,            name="block_friend"),
    path('unblock', views.unblock,          name="unblock_friend")
]