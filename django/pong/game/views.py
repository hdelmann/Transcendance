from django.shortcuts import render
from .Game import games, Game
import json
import uuid
from django.http import JsonResponse
from .models import Matches
from datetime import datetime
from auths.utils import verify_usertoken_dec
from common.decorators import secure_function, allow_methods, json_endpoint
from common.responses import DataResponse, ErrorResponse, BasicResponse
from common.validators import IntFieldChecker, ListFieldChecker
from common.getters import easy_translate
from notifs.utils import send_notification_sync
from .config_validator import validate_game_config

CUSTOM_TYPE = 1
MATCHMAKING_TYPE = 2
TOURNAMENT_TYPE = 3

DEFAULT_DISPLAY_WIDTH = 1280
DEFAULT_DISPLAY_HEIGHT = 720
DEFAULT_BALL_SIZE_X = 20
DEFAULT_BALL_SIZE_Y = 20
DEFAULT_PLAYER_SIZE_X = 5
DEFAULT_PLAYER_SIZE_Y = 100
DEFAULT_BALL_VELOCITY = 500
DEFAULT_BALL_COEF_ACC = 20
DEFAULT_TIME_MAX = 300
DEFAULT_SCORE_TO_WIN = 5

default_config = {
    "width": DEFAULT_DISPLAY_WIDTH,
    "height": DEFAULT_DISPLAY_HEIGHT,
    "ball_size": [DEFAULT_BALL_SIZE_X, DEFAULT_BALL_SIZE_Y],
    "ball_velocity": DEFAULT_BALL_VELOCITY,
    "player2_size": [DEFAULT_PLAYER_SIZE_X, DEFAULT_PLAYER_SIZE_Y],
    "player1_size": [DEFAULT_PLAYER_SIZE_X, DEFAULT_PLAYER_SIZE_Y],
    "ball_coef_acc": DEFAULT_BALL_COEF_ACC,
    "time_max": DEFAULT_TIME_MAX,
    "score_to_win": DEFAULT_SCORE_TO_WIN,
    "public": 1,
    "auto_destroy": 1,
    "need_winner": 0,
    "game_type": MATCHMAKING_TYPE,
}


@secure_function()
@allow_methods("POST")
@verify_usertoken_dec()
@json_endpoint(mandatory_fields=("width", "height",
                                 "time_max", "score_to_win",
                                 "ball_size", "ball_coef_acc",
                                 "player1_size", "player2_size",
                                 "ball_velocity"),
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
    party_id = str(uuid.uuid4())
    # pour pas que le mec "hack" ou "cheat"
    data["public"]       = 0
    data["game_type"]    = CUSTOM_TYPE
    data["need_winner"]  = 0
    data["auto_destroy"] = 1

    config = {**default_config, **data}
    game_config_error = validate_game_config(config)
    if game_config_error is not None:
        return ErrorResponse("INVALID_GAME_CONFIG", T(game_config_error[0], **(game_config_error[1])))
    games[party_id] = Game(config, party_id)
    return DataResponse({'party_uuid': party_id})

@secure_function()
@allow_methods("POST")
@verify_usertoken_dec()
def search(request, user):
    party_id = str(uuid.uuid4())
    for g in games.items():
        if g[1].is_public_party_available():
            party_id = g[0]
            break
    if party_id not in games:
        games[party_id] = Game({**default_config}, party_id)
    return DataResponse({'party_uuid': party_id})

games["w"] = Game({**default_config}, 'w')
