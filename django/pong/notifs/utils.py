from asgiref.sync import async_to_sync, sync_to_async
from django.db.models import Q

from .Notifs import notifs
from friends.models import Friends, FRIENDSHIP_ACCEPTED
from chat.models import Channels

async def send_notification_async(user_id, msg_type, msg_data):
    if user_id not in notifs:
        return
    for notif in notifs[user_id].values():
        await notif.send_notification({
            "kind": msg_type,
            "data": msg_data})

def is_notifiable(user_id):
    return user_id in notifs and len(notifs[user_id]) != 0

def __get_friendships(user_id, strict=True):
    if strict:
        return [a for a in Friends.objects.filter(
            (Q(sender=user_id)) | (Q(receiver=user_id)) & Q(status=FRIENDSHIP_ACCEPTED))]
    else:
        return [a for a in Friends.objects.filter(
            (Q(sender=user_id)) | (Q(receiver=user_id)))]

async def send_notification_to_friends_async(user_id, msg_type, msg_data):
    friendships = await sync_to_async(__get_friendships)(user_id)
    for friendship in friendships:
        await send_notification_async(
            friendship.sender if friendship.sender != user_id else friendship.receiver,
            msg_type, msg_data)

send_notification_sync = async_to_sync(send_notification_async)

def __get_channels(user_id):
    return [c for c in Channels.objects.filter(users__contains=[user_id])]

async def send_notification_to_related_users_async(user_id, msg_type, msg_data, send_to_me=False):
    already_sent_ids = [user_id]

    if send_to_me:
        await send_notification_async(user_id, msg_type, msg_data)

    # friends
    friendships = await sync_to_async(__get_friendships)(user_id, strict=False)
    for friendship in friendships:
        receiver_id = friendship.sender if friendship.sender != user_id else friendship.receiver
        already_sent_ids.append(receiver_id)
        await send_notification_async(receiver_id, msg_type, msg_data)

    # chats
    channels = await sync_to_async(__get_channels)(user_id)
    for channel in channels:
        for member in channel.users:
            if not member in already_sent_ids:
                already_sent_ids.append(member)
                await send_notification_async(member, msg_type, msg_data)

send_notification_to_related_users_sync = async_to_sync(send_notification_to_related_users_async)
