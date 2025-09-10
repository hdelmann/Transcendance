from django.http import JsonResponse

def ApiResponseBase(error_code=None, message=None, data={}, status_code=200):
    return JsonResponse({
        "success":      False if error_code else True,
        "message":      message if message else ("success" if not error_code else "error: "+error_code),
        "error_code":   error_code,
        "data":         data
    }, status=status_code)

def ErrorResponse(error_code, message=None, data={}, status_code=400):
    return ApiResponseBase(error_code=error_code, message=message, data=data, status_code=status_code)

def BasicResponse(message, data={}, status_code=200):
    return ApiResponseBase(message=message, data=data, status_code=status_code)

def DataResponse(data, message=None, status_code=200):
    return ApiResponseBase(data=data, message=message, status_code=status_code)

# frequently used responses
UserNotFoundResponse = lambda username, T: ErrorResponse(
    "USER_NOT_FOUND",
    message=T("error.user.not.found", username=username),
    data={"username": username},
    status_code=404)

PermDeniedResponse  = lambda: ErrorResponse(
    "PERMISSION_DENIED",
    message="permission denied.",
    status_code=401)

ExceptionError      = lambda e: ErrorResponse(
    "INTERNAL_ERROR",
    message="internal error: "+(str(e)),
    data={"error": str(e)})

DisallowedMethodError = lambda method, allowed_methods: ErrorResponse(
    "DISALLOWED_METHOD",
    message=f"method `{method}` is not allowed, please try: `"+("`, `".join(allowed_methods))+"`",
    data={"disallowed_method": method, "allowed_methods": allowed_methods},
    status_code=405)

InvalidJsonError = lambda: ErrorResponse(
    "INVALID_JSON",
    message="received invalid json.",
    status_code=400)

MissingFieldsError = lambda fields: ErrorResponse(
    "MISSING_FIELDS",
    message="missing fields: `"+("`, `".join(fields))+"`",
    data={"missing_fields": fields},
    status_code=400)

InvalidFieldError = lambda field, error: ErrorResponse(
    "INVALID_FIELD",
    message=error,
    data={"field": field, "error": error})

InvalidFieldTypeError = lambda field, expected: ErrorResponse(
    "INVALID_FIELD_TYPE",
    message=f"{field}: invalid type (expected: `{expected}`)",
    data={"field": field, "expected": expected})
