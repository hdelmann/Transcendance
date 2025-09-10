
MAX_DISPLAY_WIDTH=4096
MIN_DISPLAY_WIDTH=500
MAX_DISPLAY_HEIGHT=4096
MIN_DISPLAY_HEIGHT=500
MIN_BALL_SIZE=5
MAX_BALL_SIZE=40
MIN_PAD_HEIGHT=50
MAX_PAD_HEIGHT=200
MIN_PAD_WIDTH=1
MAX_PAD_WIDTH=10
MIN_BALLACCL=0
MAX_BALLACCL=500
MIN_TIME=0
MAX_TIME=60*60
MIN_SCORE=1
MAX_SCORE=50
MIN_BALL_SPEED=10
MAX_BALL_SPEED=1000

class InvalidConfig(Exception):
    pass

def __check_range(val, val_name, max_val, min_val):
    if val < min_val or val > max_val:
        raise InvalidConfig("game.invalid."+val_name, {"min": min_val, "max": max_val})

def validate_game_config(config):
    try:
        # terrain
        __check_range(config["width"], "display.width", MAX_DISPLAY_WIDTH, MIN_DISPLAY_WIDTH)
        __check_range(config["height"], "display.height", MAX_DISPLAY_HEIGHT, MIN_DISPLAY_HEIGHT)

        # ball
        __check_range(config["ball_size"][0], "ball.size.x", MAX_BALL_SIZE, MIN_BALL_SIZE)
        __check_range(config["ball_size"][1], "ball.size.y", MAX_BALL_SIZE, MIN_BALL_SIZE)
        __check_range(config["ball_velocity"], "ball.speed", MAX_BALL_SPEED, MIN_BALL_SPEED)
        __check_range(config["ball_coef_acc"], "ball.accl", MAX_BALLACCL, MIN_BALLACCL)

        # player 1
        __check_range(config["player1_size"][0], "player1.size.x", MAX_PAD_WIDTH, MIN_PAD_WIDTH)
        __check_range(config["player1_size"][1], "player1.size.y", MAX_PAD_HEIGHT, MIN_PAD_HEIGHT)

        # player 2
        __check_range(config["player2_size"][0], "player2.size.x", MAX_PAD_WIDTH, MIN_PAD_WIDTH)
        __check_range(config["player2_size"][1], "player2.size.y", MAX_PAD_HEIGHT, MIN_PAD_HEIGHT)

        # other
        __check_range(config["time_max"], "timemax", MAX_TIME, MIN_TIME)
        __check_range(config["score_to_win"], "scoremax", MAX_SCORE, MIN_SCORE)
    except InvalidConfig as e:
        return e.args
    
