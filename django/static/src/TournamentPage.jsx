import React, { useState, useEffect, useContext, Fragment } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Cookies from 'universal-cookie';
import { GamingContext } from './GamingContext.jsx'
import { UserDataContext } from './UserDataContext.jsx';
import { useTranslation } from 'react-i18next';

const WAITING_PLAYERS = 0
const WAIT_STATUS = 1
const JOIN_STATUS = 2
const CANCELLED_STATUS = 3
const FINISHED_STATUS = 4
const PLAYING_STATUS = 5
const CONN_INIT_STATUS = 6

const CONNECTION_STATUS = -1000

const RAYON = 15

function fillCanvas(ctx, cv, color) {
    ctx.fillStyle = color
    ctx.fillRect(0, 0, cv.width, cv.height)
}

function drawCircle(ctx, x, y, r, color) {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, r, 0, 2 * Math.PI)
    ctx.fill()
}

function drawLine(ctx, x1, y1, x2, y2, color) {
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
}

function getPosFromIndex(ctx, cv, index) {
    switch (index) {
        case 0: return [cv.width / 7, cv.height / 5]
        case 1: return [cv.width / 7, 2 * cv.height / 5]
        case 2: return [cv.width / 7, 3 * cv.height / 5]
        case 3: return [cv.width / 7, 4 * cv.height / 5]
        case 4: return [6 * cv.width / 7, cv.height / 5]
        case 5: return [6 * cv.width / 7, 2 * cv.height / 5]
        case 6: return [6 * cv.width / 7, 3 * cv.height / 5]
        case 7: return [6 * cv.width / 7, 4 * cv.height / 5]
        case 8: return [2 * cv.width / 7, 3 * cv.height / 10]
        case 9: return [2 * cv.width / 7, 7 * cv.height / 10]
        case 10: return [5 * cv.width / 7, 3 * cv.height / 10]
        case 11: return [5 * cv.width / 7, 7 * cv.height / 10]
        case 12: return [3 * cv.width / 7, cv.height / 2]
        case 13: return [4 * cv.width / 7, cv.height / 2]
        case 14: return [cv.width / 2, cv.height / 5]
        default:
            return null
    }
}

function drawNickname(ctx, cv, nickname, index, color) {
    ctx.fillStyle = color
    ctx.font = "10px serif";
    var txt_len = ctx.measureText(nickname).width
    var pos = getPosFromIndex(ctx, cv, index)
    var offset = index % 2 == 0 ? (-RAYON * 2) : (RAYON * 2)
    if (pos !== null) {
        ctx.fillText(nickname, pos[0] - txt_len / 2, pos[1] + offset)
    }
}

function displayAvatar(ctx, x, y, image) {
    var img = new Image()
    img.onload = function () {
        ctx.drawImage(img, 0, 0, img.width, img.height, x - RAYON, y - RAYON, RAYON * 2, RAYON * 2)
        //ctx.arc(x, y, 0, 2 * Math.PI)
        //ctx.clip()
    }
    img.src = image
}

function displayPlayerAvatar(ctx, cv, avatar, index) {
    var pos = getPosFromIndex(ctx, cv, index)
    if (pos !== null) {
        displayAvatar(ctx, pos[0], pos[1], avatar)
    }
}

function TournamentPage() {
    let { id } = useParams();
    const { setGaming } = useContext(GamingContext)
    const [status, setStatus] = useState(CONNECTION_STATUS);
    const [rank, setRank] = useState(-1);
    const [players, setPlayers] = useState([])
    const [ranking, setRanking] = useState([])
    const navigate = useNavigate()
    const cookies = new Cookies()
    const token = cookies.get('client_token')
    const { userdata, setUserdata } = useContext(UserDataContext)
    const { t, i18n } = useTranslation();

    useEffect(() => {
        if (userdata == null) {
            window.display_notif("info", t("tournament.error.notlogged"), 15)
            navigate("/")
        }
    }, [userdata])

    const initCanvas = () => {
        var cv
        var ctx
        var x
        var y

        cv = document.getElementById('tournament-canvas')
        cv.className = ''
        ctx = cv.getContext('2d')

        x = cv.width
        y = cv.height

        fillCanvas(ctx, cv, '#000000')

        // 4 a gauche
        drawCircle(ctx, x / 7, y / 5, RAYON, '#FFFFFF')
        drawCircle(ctx, x / 7, 2 * y / 5, RAYON, '#FFFFFF')
        drawLine(ctx, x / 7, y / 5, x / 7, 2 * y / 5, '#FFFFFF')
        drawCircle(ctx, x / 7, 3 * y / 5, RAYON, '#FFFFFF')
        drawCircle(ctx, x / 7, 4 * y / 5, RAYON, '#FFFFFF')
        drawLine(ctx, x / 7, 3 * y / 5, x / 7, 4 * y / 5, '#FFFFFF')
        // 2 d'apres
        drawLine(ctx, x / 7, 3 * y / 10, 2 * x / 7, 3 * y / 10, '#FFFFFF')
        drawLine(ctx, x / 7, 7 * y / 10, 2 * x / 7, 7 * y / 10, '#FFFFFF')
        drawCircle(ctx, 2 * x / 7, 3 * y / 10, RAYON, '#FFFFFF')
        drawCircle(ctx, 2 * x / 7, 7 * y / 10, RAYON, '#FFFFFF')
        drawLine(ctx, 2 * x / 7, 3 * y / 10, 2 * x / 7, 7 * y / 10, '#FFFFFF')
        // 2 du centre
        drawLine(ctx, 2 * x / 7, y / 2, 3 * x / 7, y / 2, '#FFFFFF')
        drawLine(ctx, 4 * x / 7, y / 2, 5 * x / 7, y / 2, '#FFFFFF')
        drawCircle(ctx, 3 * x / 7, y / 2, RAYON, '#FFFFFF')
        drawCircle(ctx, 4 * x / 7, y / 2, RAYON, '#FFFFFF')
        drawLine(ctx, 3 * x / 7, y / 2, 4 * x / 7, y / 2, '#FFFFFF')
        // 2 d'apres
        drawCircle(ctx, 5 * x / 7, 3 * y / 10, RAYON, '#FFFFFF')
        drawCircle(ctx, 5 * x / 7, 7 * y / 10, RAYON, '#FFFFFF')
        drawLine(ctx, 5 * x / 7, 3 * y / 10, 5 * x / 7, 7 * y / 10, '#FFFFFF')
        // 4 derniers
        drawLine(ctx, 5 * x / 7, 3 * y / 10, 6 * x / 7, 3 * y / 10, '#FFFFFF')
        drawLine(ctx, 5 * x / 7, 7 * y / 10, 6 * x / 7, 7 * y / 10, '#FFFFFF')
        drawCircle(ctx, 6 * x / 7, y / 5, RAYON, '#FFFFFF')
        drawCircle(ctx, 6 * x / 7, 2 * y / 5, RAYON, '#FFFFFF')
        drawCircle(ctx, 6 * x / 7, 3 * y / 5, RAYON, '#FFFFFF')
        drawCircle(ctx, 6 * x / 7, 4 * y / 5, RAYON, '#FFFFFF')
        drawLine(ctx, 6 * x / 7, y / 5, 6 * x / 7, 2 * y / 5, '#FFFFFF')
        drawLine(ctx, 6 * x / 7, 3 * y / 5, 6 * x / 7, 4 * y / 5, '#FFFFFF')
    }

    const updateCanvas = (infos) => {
        var cv
        var ctx
        cv = document.getElementById('tournament-canvas')
        cv.className = ''
        ctx = cv.getContext('2d')
        initCanvas()

        console.log(infos)
        for (let i = 0; i < infos.players.length; i++) {
            const rank = infos.classement.indexOf(infos.players[i][0])
            const color =   rank == -1 ?
                            "white" : (rank == 7 ?
                            "#00FF00" : "red")
            for (let j = 0; j < infos.players[i][2].length; j++) {
                drawNickname(ctx, cv, infos.players[i][1], infos.players[i][2][j], color)
                displayPlayerAvatar(ctx, cv, infos.players[i][3], infos.players[i][2][j])
            }
        }
    }

    useEffect(() => {
        if (window.game_ws != null) {
            window.display_notif("info", t("tournament.game.already.active"), 15)
            navigate("/")
            return
        }

        var start_game_timeout = null
        var is_first_packet = false
        var is_normal_disconnection = false
        
        const tournament_ws = new WebSocket("wss://"+document.location.host+"/tournament/" + id + "/" + token + "/" + i18n.language)
        tournament_ws.onclose = () => {
            if (is_normal_disconnection == false) {
                window.display_notif("error", t("tournament.error.connection.lost"), 15)
                navigate("/")
            }
        }
        tournament_ws.onmessage = (data) => {
            const dt = JSON.parse(data.data)

            if (dt.status == -1) {
                window.display_notif("info", dt.error, 15)
                navigate("/")
                return
            } else if (dt.status == CANCELLED_STATUS) {
                window.display_notif("error", t("tournament.error.occured"), 15)
                navigate("/")
                return
            }

            if (dt.status == CONN_INIT_STATUS) {
                setGaming({"type": "tournament", "uuid": id})
                window.undisplay_notif("tournament-"+id)
                is_first_packet = true
                return 
            }

            setStatus(dt.status)
            updateCanvas(dt.infos)
            if (dt.status == JOIN_STATUS && window.game_ws == null) {
                function match_task(second) {
                    if (second == 0) {
                        setGaming({ "type": "tournament_game", "uuid": dt.data });
                        window.start_game(dt.data, token, false)
                    } else {
                        window.display_notif("info", t("tournament.match.start.in."+second), 1)
                        start_game_timeout = setTimeout(match_task, 1200, second-1)
                    }
                }

                /*  si dès qu'on rejoin on recois un paquet JOIN_STATUS,
                    alors fait rejoindre instantanément
                    (sauf si on a rejoin dans les 5 secondes mais ca j'ai pas fait) */
                if (is_first_packet) {
                    setGaming({ "type": "tournament_game", "uuid": dt.data });
                    window.start_game(dt.data, token, false)
                } else {
                    match_task(5)
                }
            } else if (dt.status == FINISHED_STATUS) {
                setRank(dt.data)
            }
            is_first_packet = false
            setPlayers(dt.infos.players)
            setRanking(dt.infos.classement)
        }
        initCanvas()
        return () => {
            is_normal_disconnection = true
            tournament_ws.close()
            if (start_game_timeout !== null) {
                clearTimeout(start_game_timeout)
            }
        };
    }, []);

    const status2title = (status, rank) => {
        switch (status) {
            case WAITING_PLAYERS:   return t("tournament.title.waiting-players");
            case WAIT_STATUS:       return t("tournament.title.waiting");
            case JOIN_STATUS:       return t("tournament.title.join");
            case CANCELLED_STATUS:  return t("tournament.cancelled");
            case FINISHED_STATUS:   return t("tournament.title.finished."+rank);
            case PLAYING_STATUS:    return t("tournament.title.playing");
            case CONNECTION_STATUS: return t("tournament.title.connection");
            default:                return t("tournament.title.unknown");
        }
    }

    const get_player_by_rank = (players, ranking, rank) => {
        if (rank >= ranking.length) {
            return {id: null, avatar: "/static/question-mark.png", username: "?"}
        } else {
            const player_id = ranking[rank]
            for (let i = 0; i < players.length; i++) {
                const player = players[i];
                if (player[0] == player_id)
                    return {id: player[0], avatar: player[3], username: player[1]}
            }
            return {id: null, avatar: "/static/question-mark.png", username: "?"}
        }
    }

    return (
        <>
            <h1 style={{
                marginTop: "1em",
                marginBottom: "1em",
                textAlign: "center"
            }}>{status2title(status, rank)}</h1>
            <canvas style={{
                margin: "auto",
                display: "block",
                marginBottom: "1em"
            }} id="tournament-canvas" width="700" height="500"></canvas>
            <div className="tournament-ranking-container">
                <h4 style={{textAlign: "center"}}>{t("tournament.leaderboard.title")}</h4>
                {
                /* 2 levels, 4 per level*/
                [0, 1].map((level) => <Fragment key={level}>
                <table className="tournament-ranking">
                <thead>
                    {/* first, second, ... */}
                    <tr>{[1, 2, 3, 4].map((i) => <th key={i} scope="col">{t("tournament.rank.name."+(i+level*4))}</th>)}</tr>
                </thead>
                <tbody>
                    {/* avatars */}
                    <tr>{[0, 1, 2, 3].map((i) => 
                        <td key={i}><img className="tournament-ranking-avatar" src={get_player_by_rank(players, ranking, 7-(i+level*4)).avatar}/></td>)}</tr>
                    {/* usernames */}
                    <tr>{[0, 1, 2, 3].map((i) => 
                        <td key={i} className="tournament-ranking-username">{get_player_by_rank(players, ranking, 7-(i+level*4)).username}</td>)}</tr>
                </tbody>
                </table>
                </Fragment>)
                }
            </div>
        </>
    );
}

export default TournamentPage;
