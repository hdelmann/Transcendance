from django.urls import path

from . import views

urlpatterns = [
    path("",                        views.list_chats,   name="list_chats"),
    path("create",                  views.create_chat,  name="create_chat"),
    path("<int:chat_id>/messages",  views.get_messages, name="get_messages"),
    path("<int:chat_id>/send",      views.send_message, name="send_message")
]
