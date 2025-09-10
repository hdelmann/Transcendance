from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpResponse
from auths.utils import verify_usertoken, verify_usertoken_dec
from auths.models import USER_ADMIN_FLAG, Users, Token, USER_DELETED_FLAG
from django.core.exceptions import ValidationError
from django.contrib.auth.hashers import make_password
import os.path
from io import BytesIO
from PIL import Image, UnidentifiedImageError
import json
from common.responses import UserNotFoundResponse, PermDeniedResponse, BasicResponse, ExceptionError, DataResponse, InvalidJsonError, InvalidFieldError, ErrorResponse
from common.decorators import allow_methods, secure_function
from common.validators import validate_username, validate_email
from common.getters import get_user, get_user_matches, easy_translate, user2avatar_path
import datetime
from notifs.utils import send_notification_to_related_users_sync
from common.square_crop import square_crop

def __send_username_update_notif(user):
    send_notification_to_related_users_sync(
        user.id, "USER_NAME_UPDATED", {
            "user_id":      user.id,
            "username":     user.username
        }, send_to_me=True)

def __update_user(request, requester, user):
    T = easy_translate(request)

    if requester is None or (requester.id != user.id and (requester.flags & USER_ADMIN_FLAG) == 0):
        return PermDeniedResponse()
    
    try:
        data = json.loads(request.body)
        assert(isinstance(data,dict))
    except Exception as e:
        return InvalidJsonError()
    
    if "username" in data:
        tmp = validate_username(str(data['username']))

        if tmp:
            return InvalidFieldError("username", T(tmp))
        if Users.objects.filter(username=str(data['username'])).exists():
            return InvalidFieldError("username", T("error.username.already.in.use"))
        
        user.username = str(data['username'])
    
    if "email" in data:
        if not validate_email(str(data["email"])):
            return InvalidFieldError("email", T("error.email.inval"))
        
        if Users.objects.filter(email=str(data["email"])).exists():
            return InvalidFieldError("email", T("error.email.already.in.use"))

        user.email = str(data["email"])
    
    if "password" in data:
        if len(str(data['password'])) == 0:
            return InvalidFieldError("password", T("error.password.empty"))
        user.password = make_password(str(data["password"]))

    user.save()

    # we close sessions if the password is changed
    if "password" in data:
        Token.objects.filter(
                account_id=user.id,
                expires_at__gt=datetime.datetime.now()
            ).exclude(
                token=request.META.get('HTTP_AUTHORIZATION').split("Bearer ")[1]
            ).update(
                expires_at=datetime.datetime.now())

    return None

@secure_function()
@allow_methods("GET","POST")
@verify_usertoken_dec()
def fetch_user(request, requester, username=""):
    user = get_user(requester, username)
    if user is None:
        return UserNotFoundResponse(username, easy_translate(request))

    if request.method == "POST":
        old_username = user.username
        resp = __update_user(request, requester, user)
        if resp is not None:
            return resp
        
        if old_username != user.username:
            __send_username_update_notif(user)

    additional_fields = {}

    if len(request.GET.get('fields','')):
        fields = request.GET.get('fields','').split(',')

        for private_field in ["email"]:
            if not private_field in fields:
                continue
            if requester is None or (requester.id != user.id and (requester.flags & USER_ADMIN_FLAG) == 0):
                return PermDeniedResponse()

        if "match_history" in fields:
            matches, stats = get_user_matches(user)
            if matches != None:
                additional_fields['match_history'] = matches
                additional_fields['stats'] = stats
        
        if "email" in fields:
            additional_fields["email"] = user.email

    return DataResponse({
        "id":           user.id,
        "username":     user.username,
        "flags":        user.flags,
        "created_at":   user.created_at,
        "avatar":       user2avatar_path(user),
        **additional_fields
    })

@secure_function()
@allow_methods("GET")
@verify_usertoken_dec(optional=True)
def fetch_avatar(request, requester, username=""):
    user = get_user(requester, username)
    if user is None:
        return redirect("/static/default_avatar.png")
    if os.path.exists(f"/root/asset/avatars/{user.id}.png"):
        with open(f"/root/asset/avatars/{user.id}.png", "rb") as fp:
            return HttpResponse(fp.read(), content_type="image/png", status=200)
    return redirect("/static/default_avatar.png")

def __send_avatar_update_notif(user):
    send_notification_to_related_users_sync(
        user.id, "USER_AVATAR_UPDATED", {
            "user_id":      user.id,
            "avatar":  user2avatar_path(user)
        }, send_to_me=True)

@secure_function()
@allow_methods("POST")
@verify_usertoken_dec()
def set_avatar(request, requester, username=""):
    T = easy_translate(request)

    user = get_user(requester, username)
    if user is None:
        return UserNotFoundResponse(username, T)
    
    if requester.id != user.id and (requester.flags & USER_ADMIN_FLAG) == 0:
        return PermDeniedResponse()
    
    if len(request.body) == 0:
        try:
            os.unlink(f"/root/asset/avatars/{user.id}.png")
            user.avatar_updated_at = datetime.datetime.now()
            user.save()
        except Exception as e:
            return ExceptionError(e)
        __send_avatar_update_notif(user)
        return BasicResponse(T("success.avatar.deleted"))
    else:
        try:
            img = Image.open(BytesIO(request.body))
            os.makedirs("/root/asset/avatars/", exist_ok=True)
            square_crop(img).save(f"/root/asset/avatars/{user.id}.png")
            user.avatar_updated_at = datetime.datetime.now()
            user.save()
        except UnidentifiedImageError:
            return ErrorResponse("UNKNOWN_IMAGE_FORMAT", T("error.image.unknown.format"))
        except Exception as e:
            return ExceptionError(e)
        __send_avatar_update_notif(user)
        return BasicResponse(T("success.avatar.changed"))
