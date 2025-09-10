from auths.models import Users, USER_DELETED_FLAG
from game.models import Matches
from django.db.models import Q
import hashlib

from .translations import translations

def get_user(requester, username):
    if username == '@me':
        return requester
    
    try:
        ret = None
        if username.startswith("id:"):
            ret = Users.objects.get(id=username[3:])
        else:
            ret = Users.objects.get(username=username)
        if ret is None or (ret.flags & USER_DELETED_FLAG) != 0:
            return None
        return ret
    except Users.DoesNotExist:
        return None

def get_user_matches(user):
    matches = Matches.objects.filter(Q(player_1=user.id) | Q(player_2=user.id)).order_by("-created_at").values()
    if len(matches) == 0:
        return None, None
    wins  = 0
    loses = 0
    draws = 0
    ret = []
    for i in range(len(matches)):
        ret.append(matches[i])
        ret[i]['created_at'] = str(ret[i]['created_at'])
        try:
            tmp = Users.objects.get(id=ret[i]['player_1'])
            ret[i]['player_1_avatar'] = user2avatar_path(tmp)
            ret[i]['player_1_username'] = tmp.username
        except:
            pass
        try:
            tmp = Users.objects.get(id=ret[i]['player_2'])
            ret[i]['player_2_avatar'] = user2avatar_path(tmp)
            ret[i]['player_2_username'] = tmp.username
        except:
            pass
        if matches[i]['status'] == 1:
            if matches[i]['player_1'] == user.id:
                wins += 1
            else:
                loses += 1
        elif matches[i]['status'] == 2:
            if matches[i]['player_2'] == user.id:
                wins += 1
            else:
                loses += 1
        elif matches[i]['status'] == 3:
            draws += 1
    return ret, [wins, draws, loses]


def translate(lang, str_key, **kwargs):
    dictstr = translations.get(str_key, {})
    if lang in dictstr:
        return dictstr[lang].format(**kwargs)
    return dictstr.get("en", str_key).format(**kwargs)

def easy_translate(req):
    def func(str_key, **kwargs):
        return translate(req.COOKIES.get("lang", "en"), str_key, **kwargs)
    return func

def user2avatar_path(user):
    # just used to force the browser (and react) to reload the image when the avatar is updated
    return f"/api/user/id:{user.id}/avatar?v=" + (hashlib.sha1(str(user.avatar_updated_at).encode()).hexdigest())