from django.shortcuts import render
from common.responses import DataResponse, UserNotFoundResponse, ErrorResponse, PermDeniedResponse
from common.decorators import secure_function, allow_methods, json_endpoint
from common.getters import get_user, easy_translate, user2avatar_path
from auths.utils import verify_usertoken_dec
from auths.models import Users, USER_ADMIN_FLAG
from datetime import datetime
from django.db.models import Q
from notifs.utils import send_notification_sync
from friends.models import BlockedUsers

from .models import Channels, Messages

def __channel2json(channel):
    query = None
    for user_id in channel.users:
        if query is None:
            query = Q(id=user_id)
        else:
            query = query | Q(id=user_id)
    
    last_message = Messages.objects.filter(channel_id=channel.id).order_by("-id")[:1]

    return {
        "id": channel.id,
        "created_at": str(channel.created_at),
        "last_message": __message2json(last_message[0]) if len(last_message) != 0 else None,
        "users": [{
                "id":user.id,
                "username": user.username,
                "avatar": user2avatar_path(user)
            } for user in Users.objects.filter(query)]
    }

def __message2json(message):
    sender = Users.objects.get(id=message.sender)

    return {
        "id": message.id,
        "sender": {
            "id": sender.id,
            "username": sender.username,
            "avatar": user2avatar_path(sender)},
        "sent_at": str(message.created_at),
        "game_key": message.game_key,
        "tournament_key": message.tournament_key,
        "content": message.content
    }

def __send_new_chat_notif(creator, receiver, chat):
    data = {
        "chat": __channel2json(chat)
    }
    send_notification_sync(creator.id, "NEW_CHAT", data)
    send_notification_sync(receiver.id, "NEW_CHAT", data)

@secure_function()
@allow_methods("GET")
@verify_usertoken_dec()
def list_chats(request, user):
    chats = []
    for channel in Channels.objects.filter(users__contains=[user.id]):
        is_blocked = False

        for target_id in channel.users:
            if target_id != user.id and BlockedUsers.objects.filter(blocker=user.id, blocked=target_id).exists():
                is_blocked = True
                break
        
        if is_blocked:
            continue
        
        chats.append(__channel2json(channel))

    def get_chat_timestamp(a):
        if a["last_message"] is not None:
            return a["last_message"]["sent_at"]
        return a["created_at"]
    chats.sort(key=get_chat_timestamp, reverse=True)
    return DataResponse({"chats":chats})

@secure_function()
@allow_methods("POST")
@verify_usertoken_dec()
@json_endpoint(mandatory_fields=("username",))
def create_chat(request, user, data):
    T = easy_translate(request)

    target = get_user(user, data["username"])
    if target is None:
        return UserNotFoundResponse(data["username"], T)

    if target.id == user.id:
        return ErrorResponse("SELF_CHATTING", T("error.chat.self"))

    if BlockedUsers.objects.filter(blocker=user.id, blocked=target.id).exists():
        return ErrorResponse("CANT_CHAT_BLOCKED", T("error.chat.user.blocked"))

    try:
        channel = Channels.objects.get(Q(users__contains=[user.id]) & Q(users__contains=[target.id]))
        return DataResponse(__channel2json(channel))
    except Channels.DoesNotExist:
        channel = Channels.objects.create(
            created_at=datetime.now(),
            users=[user.id,target.id])
        channel.save()
        __send_new_chat_notif(user, target, channel)
        return DataResponse(__channel2json(channel))

@secure_function()
@allow_methods("GET")
@verify_usertoken_dec()
def get_messages(request, user, chat_id=0):
    T = easy_translate(request)

    try:
        channel = Channels.objects.get(id=chat_id)
    except Channels.DoesNotExist:
        return ErrorResponse("CHANNEL_NOT_FOUND", T("error.chat.not.found"), status_code=404)

    if not user.id in channel.users and (user.flags & USER_ADMIN_FLAG) == 0:
        return PermDeniedResponse()

    search_query = Q(channel_id=channel.id)

    if "before" in request.GET:
        search_query = search_query & Q(id__lt=request.GET["before"])
    
    if "after" in request.GET:
        search_query = search_query & Q(id__gt=request.GET["after"])

    messages = []
    for message in Messages.objects.filter(search_query).order_by('-id')[:100]:
        messages.append(__message2json(message))

    return DataResponse(messages)

@secure_function()
@allow_methods("POST")
@verify_usertoken_dec()
@json_endpoint(mandatory_fields=("message",), nullable_fields=("game_key","tournament_key"))
def send_message(request, user, data, chat_id=0):
    T = easy_translate(request)

    try:
        channel = Channels.objects.get(id=chat_id)
    except Channels.DoesNotExist:
        return ErrorResponse("CHANNEL_NOT_FOUND", T("error.chat.not.found"), status_code=404)

    if not user.id in channel.users and (user.flags & USER_ADMIN_FLAG) == 0:
        return PermDeniedResponse()

    message = Messages.objects.create(
        channel_id=channel.id,
        content=data["message"],
        created_at=datetime.now(),
        sender=user.id,
        game_key=data.get("game_key"),
        tournament_key=data.get("tournament_key"))
    message.save()

    for user in channel.users:
        send_notification_sync(user, "NEW_CHAT_MESSAGE", {
            "chat_id": channel.id,
            "message": __message2json(message)
        })

    return DataResponse(__message2json(message))