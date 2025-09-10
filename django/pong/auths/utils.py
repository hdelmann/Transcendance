from django.shortcuts import render
from django.http import JsonResponse
from auths.models import Users, Token
import datetime
import json
from asgiref.sync import sync_to_async
from common.responses import ErrorResponse

def verify_usertoken(token):
    if token is None:
        return None
    if not Token.objects.filter(token=token).exists():
        return None
    tok = Token.objects.get(token=token)
    if tok.expires_at <= datetime.datetime.now():
        return None
    user = Users.objects.get(id=tok.account_id)
    return user

verify_usertoken_async = sync_to_async(verify_usertoken)

def __verify_usertoken_err(error, func, is_optional, args, kwargs):
    if not is_optional:
        return error
    else:
        return func(*(args + (None,)), **kwargs)

def verify_usertoken_dec(optional=False):
    def verify_usertoken_subdec(func):
        def wrapper(*args, **kwargs):
            req = args[0]
            token = req.META.get('HTTP_AUTHORIZATION')
            if token == None:
                return __verify_usertoken_err(ErrorResponse("MISSING_TOKEN"),func,optional,args,kwargs)
            token = token.split('Bearer ')
            if len(token) != 2:
                return ErrorResponse("INVALID_TOKEN")
            token = token[1]
            if not Token.objects.filter(token=token).exists():
                return ErrorResponse("INVALID_TOKEN")
            tok = Token.objects.get(token=token)
            if tok.expires_at <= datetime.datetime.now():
                return ErrorResponse("EXPIRED_TOKEN")
            user = Users.objects.get(id=tok.account_id)
            args += (user,)
            return func(*args, **kwargs)
        return wrapper
    return verify_usertoken_subdec
