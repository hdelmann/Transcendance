from .models import Friends, FRIENDSHIP_PENDING, FRIENDSHIP_ACCEPTED, FRIENDSHIP_REFUSED, BlockedUsers
from auths.models import Users
from django.db.models import Q
from auths.utils import verify_usertoken_dec
from datetime import datetime
from common.responses import UserNotFoundResponse, BasicResponse, ErrorResponse, DataResponse
from common.decorators import allow_methods, json_endpoint, secure_function
from common.getters import get_user, easy_translate, user2avatar_path
from notifs.utils import send_notification_sync, is_notifiable
from game.utils import is_user_playing

FRIEND_STATUS_ERRORS = {
    FRIENDSHIP_PENDING:     ('REQUEST_ALREADY_SENT',    "status.friendship.pending"),
    FRIENDSHIP_ACCEPTED:    ('ALREADY_FRIEND',          "status.friendship.already.friend"),
    FRIENDSHIP_REFUSED:     ('REQUEST_ALREADY_SENT',    "status.friendship.pending") # lie
}

def __notify_friendship_update(updater, friendship, event_type):
    data = {
            "updater": {
                "username": updater.username,
                "id":       updater.id},
            "sender":   friendship.sender,
            "receiver": friendship.receiver}
    send_notification_sync(friendship.sender, event_type, data)
    send_notification_sync(friendship.receiver, event_type, data)

def __get_friendship(a, b):
    tmp = Friends.objects.filter((Q(sender=a.id) & Q(receiver=b.id)) | (Q(receiver=a.id) & Q(sender=b.id)))[:1]
    if len(tmp):
        return tmp[0]
    else:
        return None

@secure_function()
@allow_methods("POST")
@verify_usertoken_dec()
@json_endpoint(mandatory_fields=("username",))
def add(request, user, data):
    T = easy_translate(request)

    target = get_user(user, data["username"])
    if target is None:
        return UserNotFoundResponse(data["username"], T)

    if target.id == user.id:
        return ErrorResponse("SELF_FRIEND_REQUEST", message=T("error.friend.request.self"))

    friendship = __get_friendship(user, target)

    if friendship is None:
        req = Friends.objects.create(
            sender      = user.id,
            receiver    = target.id,
            status      = FRIENDSHIP_PENDING)
        if BlockedUsers.objects.filter(blocker=target.id, blocked=user.id).exists():
            req.status = FRIENDSHIP_REFUSED
        req.save()
        __notify_friendship_update(user, req, "FRIEND_REQUEST")
        return BasicResponse(T("success.friend.request.sent"))

    if friendship.receiver == user.id:
        friendship.status       = FRIENDSHIP_ACCEPTED
        friendship.accepted_at  = datetime.now()
        friendship.save()
        __notify_friendship_update(user, friendship, "FRIEND_REQUEST_ACCEPTED")
        return BasicResponse(T("success.friend.request.accepted"))

    err = FRIEND_STATUS_ERRORS.get(friendship.status, ("UNKNOWN_FRIEND_REQUEST_STATUS", "status.friendship.unknown"))
    return ErrorResponse(err[0],message=T(err[1]))

@secure_function()
@allow_methods("POST")
@verify_usertoken_dec()
@json_endpoint(mandatory_fields=("username",))
def remove(request, user, data):
    T = easy_translate(request)

    target = get_user(user, data["username"])
    if target is None:
        return UserNotFoundResponse(data["username"], T)

    friendship = __get_friendship(user, target)

    if friendship is None:
        return BasicResponse(T("success.friend.not.friend.removed"))

    if friendship.status == FRIENDSHIP_ACCEPTED:
        friendship.delete()
        __notify_friendship_update(user, friendship, "FRIEND_REMOVED")
        return BasicResponse(T("success.friend.removed"))

    if friendship.status == FRIENDSHIP_PENDING:
        if friendship.sender == user.id:
            friendship.delete()
            __notify_friendship_update(user, friendship, "FRIEND_CANCEL")
            return BasicResponse(T("success.friend.request.cancelled"))
        else:
            # we set the status to FRIENDSHIP_REFUSED so we can lie to the other's side
            friendship.status = FRIENDSHIP_REFUSED
            friendship.save()
            send_notification_sync(user.id, "FRIEND_REFUSED", {"refused_id": target.id})
            return BasicResponse(T("success.friend.request.denied"))

    if friendship.status == FRIENDSHIP_REFUSED:
        if friendship.sender == user.id:
            friendship.delete()
            send_notification_sync(user.id, "FRIEND_CANCEL", {
                "updater": {
                    "username": user.username,
                    "id":       user.id},
                "sender":   user.id,
                "receiver": target.id})
            return BasicResponse(T("success.friend.request.cancelled"))
        return BasicResponse(T("success.friend.not.friend.removed"))

# IMPROVEMENT: se demerder pour join user à friendship (vraiment aucune idée de comment faire)
def __friendship_to_json(friendship, user):
    friend_id = friendship.receiver if user.id == friendship.sender else friendship.sender
    try:
        user = Users.objects.get(id=friend_id)
        if friendship.status != FRIENDSHIP_ACCEPTED:
            status = {}
        elif is_notifiable(friend_id):
            status = {"status": "ingame" if is_user_playing(user) else "online"}
        else:
            status = {"status": "offline"}
        return {"id": user.id, "username": user.username, "avatar": user2avatar_path(user), **status}
    except:
        return {"id": friend_id, "username": "<error>", "avatar": f"/api/user/id:{friend_id}/avatar", "status": "error"}

@secure_function()
@verify_usertoken_dec()
def list_friendships(request, user):
    ret = {
        "friends": [],
        "sent": [],
        "received": [],
        "blocked": []}

    friendships = Friends.objects.filter(
        (Q(sender=user.id)) | (Q(receiver=user.id)))

    for friendship in friendships:
        if friendship.status == FRIENDSHIP_ACCEPTED:
            ret["friends"].append(__friendship_to_json(friendship, user))
        elif friendship.sender == user.id:
            ret["sent"].append(__friendship_to_json(friendship, user))
        elif friendship.status != FRIENDSHIP_REFUSED:
            ret["received"].append(__friendship_to_json(friendship, user))

    blocks = BlockedUsers.objects.filter(blocker=user.id)

    for block in blocks:
        try:
            blocked = Users.objects.get(id=block.blocked)
            ret["blocked"].append({
                "id": blocked.id,
                "username": blocked.username,
                "avatar": user2avatar_path(blocked)})
        except:
            pass

    return DataResponse(ret)

@secure_function()
@allow_methods("POST")
@verify_usertoken_dec()
@json_endpoint(mandatory_fields=("username",))
def block(request, user, data):
    T = easy_translate(request)

    target = get_user(user, data["username"])
    if target is None:
        return UserNotFoundResponse(data["username"], T)

    if target.id == user.id:
        return ErrorResponse("SELF_BLOCK_REQUEST", message=T("error.block.self"))

    if BlockedUsers.objects.filter(blocker=user.id, blocked=target.id).exists():
        return ErrorResponse("ALREADY_BLOCKED", message=T("error.block.already"))
    
    BlockedUsers.objects.create(
        blocker=user.id,
        blocked=target.id
    ).save()
    send_notification_sync(user.id, "USER_BLOCKED", {"blocked": target.id})

    friendship = __get_friendship(user, target)

    if friendship:
        if friendship.sender == user.id or friendship.status == FRIENDSHIP_ACCEPTED:
            friendship.delete()
        else:
            friendship.status = FRIENDSHIP_REFUSED
            friendship.save()

    return BasicResponse(T("success.block.blocked"))

@secure_function()
@allow_methods("POST")
@verify_usertoken_dec()
@json_endpoint(mandatory_fields=("username",))
def unblock(request, user, data):
    T = easy_translate(request)

    target = get_user(user, data["username"])
    if target is None:
        return UserNotFoundResponse(data["username"], T)
    
    try:
        BlockedUsers.objects.get(blocker=user.id, blocked=target.id).delete()
        send_notification_sync(user.id, "USER_UNBLOCKED", {"blocked": target.id})
        return BasicResponse(T("success.unblock.unblocked"))
    except BlockedUsers.DoesNotExist:
        return ErrorResponse("NOT_BLOCKED", message=T("error.unblock.not.blocked"))
