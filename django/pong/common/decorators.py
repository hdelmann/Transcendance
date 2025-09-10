import json
from .responses import DisallowedMethodError, InvalidJsonError, MissingFieldsError, InvalidFieldTypeError, ExceptionError

def allow_methods(*methods):
    def decorator(func):
        def wrapper(*args, **kwargs):
            if not args[0].method in methods:
                return DisallowedMethodError(args[0].method, methods)
            return func(*args, **kwargs)
        return wrapper
    return decorator

def json_endpoint(
            enforce_input_type  = dict,
            mandatory_fields    = (),
            field_checkers      = {},
            nullable_fields     = ()):
    def decorator(func):
        def wrapper(*args, **kwargs):
            try:
                data = json.loads(args[0].body)
            except:
                return InvalidJsonError()

            if enforce_input_type and not isinstance(data,enforce_input_type):
                return InvalidFieldTypeError("__root__", str(enforce_input_type.__name__))

            if len(mandatory_fields):
                mandatory = list(mandatory_fields)
                if isinstance(data, dict):
                    for k in mandatory_fields:
                        if k in data:
                            mandatory.remove(k)
                    
                    for k, v in data.items():
                        if k in field_checkers:
                            v, s = field_checkers[k].check(v)
                            if not s:
                                return InvalidFieldTypeError(k, field_checkers[k].describe())
                            data[k] = v
                        elif v is not None or k not in nullable_fields:
                                data[k] = str(v)
                if len(mandatory):
                    return MissingFieldsError(mandatory)

            return func(*(args + (data,)), **kwargs)
        return wrapper
    return decorator

def secure_function(custom_response=lambda e: ExceptionError(f"<internal error>")):
    def decorator(function):
        def secured_function(*args,**kwargs):
            try:
                return function(*args,**kwargs)
            except Exception as e:
                return custom_response(e)
        return secured_function
    return decorator
