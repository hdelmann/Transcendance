import re
from django.core.validators import validate_email as django_validate_email
from django.core.exceptions import ValidationError

def validate_username(username):
    if len(username) > 16:
        return "error.username.inval.gtr.16"
    elif len(username) == 0:
        return "error.username.inval.blank"
    elif not re.fullmatch(r"[a-zA-Z0-9\_]+", username): # please, think to change the translations if it is changed
        return "error.username.inval.charset"
    return None

def validate_email(email):
    try:
        django_validate_email(email)
        return not email.endswith("@localhost")
    except:
        return False

class IntFieldChecker():
    def __init__(self):
        pass

    def describe(self):
        return "int"

    def check(self, val):
        try:
            return int(val), True
        except:
            return None, False

class ListFieldChecker():
    def __init__(self, children_type, size=None):
        self.children_type  = children_type
        self.size           = size

    def describe(self):
        out = "("+(self.children_type.describe())+")"
        if self.size is not None:
            return out + f"[{self.size}]"
        else:
            return out + "[]"

    def check(self, val):
        if not isinstance(val, list):
            return None, False

        if self.size is not None and len(val) != self.size:
            return None, False

        new_val = []
        for v in val:
            v, s = self.children_type.check(v)
            if not s:
                return None, False
            new_val.append(v)

        return new_val, True
