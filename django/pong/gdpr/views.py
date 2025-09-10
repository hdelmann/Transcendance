from common.decorators import allow_methods
from auths.utils import verify_usertoken_dec
from django.http import HttpResponse
import json
import tarfile
import io
from django.db.models import Q
import os.path
import os
import uuid
import time
from common.responses import DataResponse, ErrorResponse, BasicResponse
from django.contrib.auth.hashers import UNUSABLE_PASSWORD_PREFIX
from notifs.utils import send_notification_sync

from chat.models import Channels, Messages
from auths.models import Users, Token, USER_DELETED_FLAG
from friends.models import Friends, BlockedUsers, FRIENDSHIP_REFUSED
from game.models import Matches
from tournaments.models import Tournaments

export_keys = {}

@allow_methods("GET")
@verify_usertoken_dec()
def generate_export_key(request, requester):
    if len(export_keys) > 100:
        # if we exceed our limit, we delete the older export key
        del export_keys[[k for k in export_keys.keys()][0]]

    key = str(uuid.uuid4())
    export_keys[key] = (requester.id, time.time())

    return DataResponse({"key": key})

@allow_methods("GET")
def export_data(request, token_id=""):
    user_id, generated_at = export_keys.get(token_id, (None, 0))
    if user_id is None or generated_at < (time.time()-120):
        return ErrorResponse("UNKNOWN_EXPORT_KEY", "this export key doesn't seem to be valid (or is expired)")
    
    del export_keys[token_id]

    user = Users.objects.get(id=user_id)

    memory_buffer = io.BytesIO()

    def dict2strdict(d):
        ret = {}
        for k, v in d.items():
            if not isinstance(v, list):
                ret[k] = str(v)
            else:
                ret[k] = v
        return ret

    with tarfile.open(fileobj=memory_buffer, mode='w') as tar:
        user_ids = set()

        # avatar (if any)
        if os.path.exists(f"/root/asset/avatars/{user.id}.png"):
            with open(f"/root/asset/avatars/{user.id}.png", "rb") as fp:
                tar_info = tarfile.TarInfo(name="avatar.png")
                data = fp.read()
                tar_info.size = len(data)
                tar.addfile(tar_info, fileobj=io.BytesIO(data))
        
        # chat list
        tar_info = tarfile.TarInfo(name="chats.json")
        chats = [c for c in Channels.objects.filter(users__contains=[user.id]).values()]
        data = json.dumps([dict2strdict(c) for c in chats]).encode()
        tar_info.size = len(data)
        tar.addfile(tar_info, fileobj=io.BytesIO(data))

        # get user ids from chats
        for chat in chats:
            for u in chat["users"]:
                user_ids.add(u)

        # messages
        tar_info = tarfile.TarInfo(name="messages.json")
        if len(chats):
            queryset = Q(channel_id=chats[0]["id"])
            for chat in chats[1:]:
                queryset |= Q(channel_id=chat["id"])
            messages = [dict2strdict(m) for m in Messages.objects.filter(queryset).values()]
        else:
            messages = []
        data = json.dumps(messages).encode()
        tar_info.size = len(data)
        tar.addfile(tar_info, fileobj=io.BytesIO(data))

        # user (yes, i retrieve it as a list, but who care)
        tar_info = tarfile.TarInfo(name="user.json")
        data_user = Users.objects.filter(id=user.id).values()[0]
        data = json.dumps(dict2strdict(data_user)).encode()
        tar_info.size = len(data)
        tar.addfile(tar_info, fileobj=io.BytesIO(data))

        # sessions
        tar_info = tarfile.TarInfo(name="sessions.json")
        sessions = [dict2strdict(s) for s in Token.objects.filter(account_id=user.id).values()]
        data = json.dumps(sessions).encode()
        tar_info.size = len(data)
        tar.addfile(tar_info, fileobj=io.BytesIO(data))

        # friends
        tar_info = tarfile.TarInfo(name="friendships.json")
        friends = [dict2strdict(f) for f in Friends.objects.filter(Q(sender=user.id) | Q(receiver=user.id)).values()]
        data = json.dumps(friends).encode()
        tar_info.size = len(data)
        tar.addfile(tar_info, fileobj=io.BytesIO(data))

        # get user ids from friends
        for friend in friends:
            user_ids.add(friend["receiver"])
            user_ids.add(friend["sender"])

        # blocked_users
        tar_info = tarfile.TarInfo(name="blocked_users_ids.json")
        busers = [u["blocked"] for u in BlockedUsers.objects.filter(blocker=user.id).values()]
        data = json.dumps(busers).encode()
        tar_info.size = len(data)
        tar.addfile(tar_info, fileobj=io.BytesIO(data))

        # get user ids from blocked_users
        for buser in busers:
            user_ids.add(buser)

        # matches
        tar_info = tarfile.TarInfo(name="matches.json")
        matches = [dict2strdict(m) for m in Matches.objects.filter(Q(player_1=user.id) | Q(player_2=user.id)).values()]
        data = json.dumps(matches).encode()
        tar_info.size = len(data)
        tar.addfile(tar_info, fileobj=io.BytesIO(data))

        # get user ids from matches
        for match in matches:
            user_ids.add(match["player_1"])
            user_ids.add(match["player_2"])

        # tournaments
        tar_info = tarfile.TarInfo(name="tournaments.json")
        tournaments = [dict2strdict(t) for t in Tournaments.objects.filter(players__contains=[user.id]).values()]
        data = json.dumps(tournaments).encode()
        tar_info.size = len(data)
        tar.addfile(tar_info, fileobj=io.BytesIO(data))

        # get user ids from tournaments
        for tournament in tournaments:
            for player_id in tournament["players"]:
                user_ids.add(player_id)

        # users.json
        tar_info = tarfile.TarInfo(name="users.json")
        user_ids = list(user_ids)
        users = {}
        if len(user_ids):
            queryset = Q(id=user_ids[0])
            for user_id in user_ids[1:]:
                queryset |= Q(id=user_id)
            for u in Users.objects.filter(queryset).values():
                users[u["id"]] = dict2strdict({
                    k: v for k, v in u.items()
                    if k in ["id", "username", "flags", "created_at"]})
        data = json.dumps(users).encode()
        tar_info.size = len(data)
        tar.addfile(tar_info, fileobj=io.BytesIO(data))

    return HttpResponse(
        memory_buffer.getvalue(),
        headers={
            "Content-Type": "application/octet-stream",
            "Content-Disposition": f'attachment; filename="export_user_{user.id}.tar"',
        },
    )

@allow_methods("POST")
@verify_usertoken_dec()
def delete_data(request, requester):
    try:
        os.unlink(f"/root/asset/avatars/{requester.id}.png")
    except FileNotFoundError:
        pass

    requester.username          = f"deleted-{requester.id}"
    requester.password          = UNUSABLE_PASSWORD_PREFIX+"deleted"
    requester.email             = f"{requester.id}@localhost"
    requester.flags             = USER_DELETED_FLAG
    requester.creation_ip       = "127.0.0.1"
    requester.avatar_updated_at = requester.created_at

    requester.save()

    friend_ids = [
        f.sender if f.sender != requester.id else f.receiver
        for f in Friends.objects.filter(
            Q(sender=requester.id) |
            Q(receiver=requester.id))
        if not (
            f.status == FRIENDSHIP_REFUSED and
            f.sender == requester.id
        )
    ]

    Friends.objects.filter(
        Q(sender=requester.id) |
        Q(receiver=requester.id)).delete()
    BlockedUsers.objects.filter(
        Q(blocker=requester.id) |
        Q(blocked=requester.id)).delete()

    chats = Channels.objects.filter(users__contains=[requester.id]).values("id", "users")
    removed_chats = []
    if len(chats):
        queryset = Q(channel_id=chats[0]["id"])
        for u in chats[0]["users"]:
            if u != requester.id:
                removed_chats.append((u, chats[0]["id"]))
        for chat in chats[1:]:
            queryset |= Q(channel_id=chat["id"])
            for u in chat["users"]:
                if u != requester.id:
                    removed_chats.append((u, chat["id"]))
        Messages.objects.filter(queryset).delete()
    Channels.objects.filter(users__contains=[requester.id]).delete()

    Token.objects.filter(account_id=requester.id).delete()
    for removed_chat in removed_chats:
        send_notification_sync(removed_chat[0], "CHAT_GDPR", {"chat_id": removed_chat[1]})
    for friend_id in friend_ids:
        send_notification_sync(friend_id, "FRIEND_GDPR", {"user_id": requester.id})
    return BasicResponse("success")
