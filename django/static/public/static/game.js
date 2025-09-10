GAME_BASE_WS = "wss://"+document.location.host+"/game/"

PACKET_INIT_ID=0x1
PACKET_INIT_CONFIRM_ID=0x2
PACKET_PLAY_ID=0x3
PACKET_PLAYER_PLAY_ID=0x4
PACKET_FINISH_ID=0x5

GAME_UPDATE_RATE=16

game_ws = null
game_ended = false
game_started = false
player1_name = ''
player2_name = ''
is_game_mouse_handler_setup = false
waiting_player_notif_id = null
game_state = null
game_height = 1
game_width = 1
user_index = 0

function time2human(time) {
    let minutes = Math.floor(time / 60);
    let seconds = time % 60;

    minutes = minutes.toString().padStart(2, '0');
    seconds = seconds.toString().padStart(2, '0');

    return minutes + (time % 2 != 0 ? ":" : " ") + seconds;
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function gutils_display_ball(ctx, ball) {
    ctx.beginPath()
    ctx.arc(ball.x + ball.width / 2, ball.y + ball.height / 2, ball.width / 2, 0, 2 * Math.PI)
    ctx.fillStyle = '#FFFFFF'
    ctx.fill()
}

function gutils_display_rect(ctx, rect) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
}

lastUpdateTime = 0

function scale_rect(rect, scale, cv) {
    return {
        x: (Math.floor(rect.x*scale) < cv.width) ? Math.floor(rect.x*scale) : cv.width-1,
        y: (Math.floor(rect.y*scale) < cv.height) ? Math.floor(rect.y*scale) : cv.height-1,
        width: Math.floor((rect.width*scale < 1) ? 1 : rect.width*scale),
        height: Math.floor((rect.height*scale < 1) ? 1 : rect.height*scale)}
}

function gpong_render_task() {
    var currentTime = performance.now();
    var deltaTime = (currentTime - lastUpdateTime) / 1000;
    lastUpdateTime = currentTime;
    if (game_started == false || game_ended == true)
        return

    if (game_state == null) {
        setTimeout(gpong_render_task, GAME_UPDATE_RATE)
        return
    }

    if (game_state.cooldown <= 0)
    {
        game_state.ball.x = game_state.ball.x + (game_state.ball.velocity * Math.cos(game_state.ball.direction) * deltaTime)
        game_state.ball.y = game_state.ball.y + (game_state.ball.velocity * Math.sin(game_state.ball.direction) * deltaTime)
    }

    display_scale = 1
    cv = document.getElementById("game-canvas")

    // IMPROVEMENT: calculer seulement quand la fenetre/la game change de taille ?
    // IMPROVEMENT: agrandir si petit ?
    // on recupere l'echelle a laquelle l'afficher (si l'ecran est trop petit on baisse l'echelle)
    while ((game_height*display_scale) > window.innerHeight || (game_width*display_scale) > window.innerWidth) {
        display_scale /= 1.25

        // ecran vraiment ton petit, on va juste mettre la canvas en 0x0 et on va attendre
        if ((game_height*display_scale) < 1 || (game_width*display_scale) < 1) {
            cv.width = 0
            cv.height = 0
            setTimeout(gpong_render_task, GAME_UPDATE_RATE)
            return
        }
    }

    cv.width    = Math.ceil(game_width*display_scale)
    cv.height   = Math.ceil(game_height*display_scale)
    ctx = cv.getContext('2d')
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, cv.width, cv.height)
    gutils_display_rect(ctx, scale_rect(game_state.players[0],  display_scale, cv))
    gutils_display_rect(ctx, scale_rect(game_state.players[1],  display_scale, cv))
    gutils_display_rect(ctx, scale_rect(game_state.ball,        display_scale, cv))

    ctx.font = "30px gameFont, Arial"
    ctx.fillStyle = '#FFFFFF'
    //ctx.fillRect(cv.width / 2 - 2, 0, 4, cv.height)

    if (game_state.cooldown > 0) {
        width = ctx.measureText(Math.floor(game_state.cooldown)).width
        ctx.fillText(Math.floor(game_state.cooldown), cv.width / 2 - width / 2, cv.height / 3 - 15)
    }

    ctx.font = "10px Arial"
    remaining_time_str  = time2human(game_state.remaining_time)
    remaining_time_size = ctx.measureText(remaining_time_str).width
    ctx.fillText(
        remaining_time_str,
        (cv.width/2) - (remaining_time_size/2), 17)

    ctx.font = "20px gameFont, Arial"
    ctx.fillText(game_state.players[0].score,
        (cv.width/2) - (remaining_time_size/2) - ctx.measureText(game_state.players[0].score).width - 15, 20)
    ctx.fillText(game_state.players[1].score,
        (cv.width/2) + (remaining_time_size/2) + 15, 20)

    ctx.font = "20px gameFont, Arial"
    ctx.fillText(player1_name, 20, 20)
    ctx.fillText(player2_name, cv.width - ctx.measureText(player2_name).width - 20, 20)

    setTimeout(gpong_render_task, GAME_UPDATE_RATE)
}

function gpong_handler(data) {
    dt = JSON.parse(data.data)
    
    if (dt.id == -1) {
        game_ended = true
        display_notif(dt.error_code == "GAME_FULL" ? "info" : "error", dt.error, 10)
        game_ws.close()
    } else if (dt.id == PACKET_INIT_ID) {
        undisplay_notif(waiting_player_notif_id)
        game_started = true
        player1_name = dt.players[0].username
        player2_name = dt.players[1].username
        if (dt.players[0].id == userdata.id)
            user_index = 0
        if (dt.players[1].id == userdata.id)
            user_index = 1
        document.getElementById("game-component-set").className = ""
        cv = document.getElementById("game-canvas")
        game_height = dt.height
        game_width = dt.width
        game_ws.send(JSON.stringify({"id": PACKET_INIT_CONFIRM_ID}))
        gpong_render_task()
    } else if (dt.id == PACKET_PLAY_ID) {
        lastUpdateTime = performance.now()
        game_state = dt
    } else if (dt.id == PACKET_FINISH_ID) {
        game_ended = true
        game_state = null

        if (dt.winner === null) {
            display_notif("info", T("game.end.draw"), 10)
        } else if (dt.winner == userdata.id) {
            display_notif("star", T("game.end.win"), 10)
        } else {
            display_notif("info", T("game.end.lose"), 10)
        }

        game_ws.close()
    }
}

function gpong_onclose() {
    if (game_ended == false)
        display_notif("error", T("game.connection.lost"), 10)
    document.getElementById("game-component-set").className = "hidden"
    game_started    = false
    game_state      = null
    game_ws         = null
    game_state      = null
    setGaming(null)

    undisplay_notif(waiting_player_notif_id)
}

async function start_game(game_uuid, token, is_cancellable) {
    if (game_ws !== null) {
        display_notif("error", T("game.already.in.game"), 10)
        return
    }

    game_ws = new WebSocket(GAME_BASE_WS + game_uuid + "/" + token + "/" + user_language)
    game_ws.onmessage   = gpong_handler
    game_ws.onclose     = gpong_onclose
    game_started        = false
    game_ended          = false
    game_state          = null

    if (is_game_mouse_handler_setup == false) {
        document.getElementById("game-canvas").addEventListener('mousemove', function(event) {
            if (game_ws === null)
                return
            cv = document.getElementById("game-canvas")
            rect = cv.getBoundingClientRect()

            y = Math.round(
                (event.clientY - rect.y) *
                (game_width / cv.width))

            // to centre the pad, we need the game_state
            if (game_state != null)
                y -= (game_state.players[user_index].height * (game_width / cv.width)) / 2

            game_ws.send(JSON.stringify({
                    "id": PACKET_PLAYER_PLAY_ID,
                    "pos": [
                        Math.round(
                            (event.clientX - rect.x) *
                            (game_height / cv.height)),
                        y]
            }))
            if (game_state != null) {
                game_state.players[user_index].y = y
            }
        })
        is_game_mouse_handler_setup = true
    }
    
    waiting_player_notif_id = display_notif(
        "loading", T("game.waiting.for.player"), 0,
        (is_cancellable) ? () => {
            game_started    = true
            game_ended      = true
            game_ws.close()
        }: null)
}
