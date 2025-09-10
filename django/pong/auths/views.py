import json
from .models import Users, Token, USER_OAUTH_FLAG
from django.http import JsonResponse
from django.contrib.auth.hashers import make_password, check_password
from django.shortcuts import redirect
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import UNUSABLE_PASSWORD_PREFIX
from django.db.models import Q
import hashlib
import uuid
import datetime
from common.decorators import allow_methods, json_endpoint, secure_function
from common.responses import ErrorResponse, DataResponse, BasicResponse, InvalidFieldError
from common.validators import validate_username, validate_email
from common.getters import easy_translate
import requests
import os
import random
from PIL import Image
from io import BytesIO
from common.square_crop import square_crop

BadCredentialsError = lambda T: ErrorResponse("BAD_CREDENTIALS", T("error.bad.credentials"))

def __create_user(request, username, email, password, flags=0):
    if password is not None:
        hashed_password = make_password(password)
    else:
        hashed_password = UNUSABLE_PASSWORD_PREFIX+"menfou"
    
    new_user = Users.objects.create(
        username    = username,
        email       = email,
        password    = hashed_password,
        flags       = flags,
        creation_ip = request.headers.get('X-Forwarded-For', request.META.get('REMOTE_ADDR'))
    )
    new_user.save()
    return new_user

@secure_function()
@allow_methods("POST")
@json_endpoint(mandatory_fields=("username","password","email"))
def register(request, data):
    T = easy_translate(request)

    tmp = validate_username(data['username'])
    if tmp:
        return InvalidFieldError("username", T(tmp))
    if Users.objects.filter(username=data['username']).exists():
        return InvalidFieldError("username", T("error.username.already.in.use"))
    if Users.objects.filter(email=data['email']).exists():
        return InvalidFieldError("email", T("error.email.already.in.use"))

    if not validate_email(data['email']):
        return InvalidFieldError("email", T("error.email.inval"))

    if len(data['password']) == 0:
        return InvalidFieldError("password", T("error.password.empty"))

    __create_user(request, data["username"], data["email"], data["password"])
    return BasicResponse(T("success.user.registered"))

def __create_session(request, user):
    _Token = str(uuid.uuid4())
    tok = Token(
        token       = _Token,
        expires_at  = datetime.datetime.now() + datetime.timedelta(hours=10),
        login_ip    = request.headers.get('X-Forwarded-For', request.META.get('REMOTE_ADDR')),
        user_agent  = request.META.get('HTTP_USER_AGENT'),
        account_id  = user.id,
    )
    tok.save()
    return _Token

@secure_function()
@allow_methods("POST")
@json_endpoint(mandatory_fields=("login","password"))
def connect(request, data):
    T = easy_translate(request)

    if not Users.objects.filter(Q(username=data["login"]) | Q(email=data["login"])).exists():
        return BadCredentialsError(T)
    user = Users.objects.get(Q(username=data["login"]) | Q(email=data["login"]))

    if check_password(data['password'],user.password):
        return DataResponse({"token": __create_session(request, user)})
    return BadCredentialsError(T)

OAUTH_ERROR_PATH="/oauth_error"
@secure_function(custom_response=lambda e: redirect(OAUTH_ERROR_PATH))
def oauth(request):
    code        = request.GET.get("code")
    state    = request.COOKIES.get("oauth_state")
    if not code or not state:
        return redirect(OAUTH_ERROR_PATH)
    resp = requests.post(
        "https://api.intra.42.fr/oauth/token",
        data={
            "grant_type":       "authorization_code",
            "client_id":        os.getenv("OAUTH_UID"),
            "client_secret":    os.getenv("OAUTH_SECRET"),
            "code":             code,
            "state":            state,
            # puisqu'on utilise apache pour l'https, django pense qu'on est en http
            "redirect_uri":     "https"+(request.build_absolute_uri()[4:].split("?")[0])})
    
    assert(resp.status_code == 200)
    client_token = resp.json()["access_token"]

    resp = requests.get("https://api.intra.42.fr/v2/me",
        headers={"Authorization": "Bearer "+client_token})
    
    assert(resp.status_code == 200)
    profile42 = resp.json()
    username    = profile42["login"]
    email       = profile42["email"]
    profile_img = profile42["image"]["versions"]["large"]
    print(profile_img)

    if Users.objects.filter(email=email).exists():
        user = Users.objects.get(email=email)
        if (user.flags & USER_OAUTH_FLAG) == 0:
            user.flags |= USER_OAUTH_FLAG
            user.save()
    else:
        original_username = username
        while Users.objects.filter(username=username).exists():
            username = original_username+"-"+str(random.randint(111_111, 999_999))
        user = __create_user(request, username, email, None, flags=USER_OAUTH_FLAG)
        try:
            img_bytes = BytesIO(requests.get(profile_img).content)
            os.makedirs("/root/asset/avatars/", exist_ok=True)
            img = Image.open(img_bytes)
            square_crop(img).save(f"/root/asset/avatars/{user.id}.png")
        except Exception as e:
            print(e)

    token = __create_session(request, user)
    resp = redirect("/")
    resp.set_cookie('client_token', token, max_age=60*60*24)
    return resp