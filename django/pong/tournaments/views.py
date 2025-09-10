from django.shortcuts import render
from common.decorators import secure_function, allow_methods, json_endpoint
from auths.utils import verify_usertoken_dec, verify_usertoken_async
from common.responses import DataResponse, ErrorResponse, BasicResponse
from common.getters import easy_translate
from notifs.utils import send_notification_sync
from game.views import default_config
from .Tournaments import tournaments, Tournament
from asgiref.sync import sync_to_async, async_to_sync
import asyncio
import json
import uuid
from common.validators import IntFieldChecker, ListFieldChecker
from game.config_validator import validate_game_config

GAME_MANDATORY_FIELDS=("width", "height",
                                 "time_max", "score_to_win",
                                 "ball_size", "ball_coef_acc",
                                 "player1_size", "player2_size",
                                 "ball_velocity")

@secure_function()
@allow_methods("POST")
@verify_usertoken_dec()
@json_endpoint(mandatory_fields=GAME_MANDATORY_FIELDS,
                field_checkers={
                    "width":            IntFieldChecker(),
                    "height":           IntFieldChecker(),
                    "time_max":         IntFieldChecker(),
                    "score_to_win":     IntFieldChecker(),
                    "ball_size":        ListFieldChecker(IntFieldChecker(), size=2),
                    "ball_coef_acc":    IntFieldChecker(),
                    "player1_size":     ListFieldChecker(IntFieldChecker(), size=2),
                    "player2_size":     ListFieldChecker(IntFieldChecker(), size=2),
                    "ball_velocity":    IntFieldChecker()})
def create(request, user, data):
    T = easy_translate(request)

    # remove unwanted fields
    for k in list(data.keys()):
        if k not in GAME_MANDATORY_FIELDS:
            del data[k]
    
    t_uuid = str(uuid.uuid4())
    config = {**default_config, **data}
    game_config_error = validate_game_config(config)
    if game_config_error is not None:
        return ErrorResponse("INVALID_GAME_CONFIG", T(game_config_error[0], **(game_config_error[1])))
    tournaments[t_uuid] = Tournament(config, t_uuid, 0)
    return DataResponse({"tournament": t_uuid})

@secure_function()
@allow_methods("POST")
@verify_usertoken_dec()
def search(request, user):
    tournament_id = str(uuid.uuid4())
    for g in tournaments.items():
        if g[1].is_public_tournament_available():
            tournament_id = g[0]
            break
    if tournament_id not in tournaments:
        tournaments[tournament_id] = Tournament({**default_config}, tournament_id, 1)
    return DataResponse({'tournament': tournament_id})
