import Cookies from "universal-cookie"
import GetFriends from "./GetFriends"
import { FriendshipContext } from './FriendshipContext'
import { UserDataContext } from "./UserDataContext"
import React, { useContext, useEffect } from 'react';
import { ChatContext } from "./ChatContext";
import i18next from "i18next";
import { useNavigate } from "react-router-dom";

var ws = null
const NOTIF_BASE_WS = "wss://"+document.location.host+"/notifs/"
var g_setUserData = null 
var g_setFriendships = null
var g_setMessages = null
var g_chatid = 0
var g_setChatlist = null
var g_setChatid = null
var g_userdata = null
var g_wait_for_reconnect_id = null
var g_navigate = null

function onMessage(data) {
    const dt = JSON.parse(data.data)
    if(dt.kind == "FRIEND_REQUEST_ACCEPTED" || 
       dt.kind == "FRIEND_REQUEST"          ||
       dt.kind == "FRIEND_REMOVED"          ||
       dt.kind == "FRIEND_REFUSED"          ||
       dt.kind == "FRIEND_GDPR"             ||
       dt.kind == "FRIEND_CANCEL"           ||
       dt.kind == "USER_BLOCKED"            ||
       dt.kind == "USER_UNBLOCKED") {
        GetFriends(g_setUserData, g_setFriendships, false)
    } else if (dt.kind == "NEW_CHAT_MESSAGE") {
        g_setChatlist((chats) => {
            for (let i = 0; i < chats.length; i++) {
                if (chats[i].id == dt.data.chat_id) {
                    chats[i].last_message = dt.data.message
                    return [...chats]
                }
            }
            return chats
        })

        if (dt.data.chat_id == g_chatid) {
            g_setMessages((messages) => {
                return [...messages, dt.data.message]
            })
        }
    } else if (dt.kind == 'TOURNAMENT_MATCH_ALERT') {
        window.display_notif("info",
            i18next.t("tournament.game.waiting.alert"),
            dt.data.timeout, null, () => {
                g_navigate("/tournament/"+dt.data.uuid)
            }, "tournament-"+dt.data.uuid)
    } else if (dt.kind == 'NEW_CHAT') {
        g_setChatlist((chats) => {
            return [...chats, dt.data.chat]
        })
    } else if (dt.kind == "USER_WENT_OFFLINE") {
        g_setFriendships((friendships) => {
            for (let i = 0; i < friendships.friends.length; i++) {
                if (friendships.friends[i].id == dt.data.id) {
                    friendships.friends[i].status = "offline"
                    return Object.create(friendships)
                }
            }
            return friendships
        })
    } else if (dt.kind == "USER_WENT_ONLINE") {
        g_setFriendships((friendships) => {
            for (let i = 0; i < friendships.friends.length; i++) {
                if (friendships.friends[i].id == dt.data.id) {
                    friendships.friends[i].status = "online"
                    return Object.create(friendships)
                }
            }
            return friendships
        })
    } else if (dt.kind == "USER_WENT_INGAME") {
        g_setFriendships((friendships) => {
            for (let i = 0; i < friendships.friends.length; i++) {
                if (friendships.friends[i].id == dt.data.id) {
                    friendships.friends[i].status = "ingame"
                    return Object.create(friendships)
                }
            }
            return friendships
        })
    } else if (dt.kind == "CHAT_GDPR") {
        g_setChatlist((chats) => {
            for (let i = 0; i < chats.length; i++) {
                if (chats[i].id == dt.data.chat_id) {
                    chats.splice(i, 1)
                    return [...chats]
                }
            }
            return chats
        })

        // if the current chat is the removed one, then quit it
        if (dt.data.chat_id == g_chatid)
            g_setChatid(0)
    } else if (dt.kind == "USER_AVATAR_UPDATED") {
        g_setUserData((userdata) => {
            if (userdata.id == dt.data.user_id) {
                userdata.avatar = dt.data.avatar
                return Object.create(userdata)
            }
            return userdata
        }) 

        g_setFriendships((friendships) => {
            for (let i = 0; i < friendships.friends.length; i++) {
                if (friendships.friends[i].id == dt.data.user_id) {
                    friendships.friends[i].avatar = dt.data.avatar
                    return Object.create(friendships)
                }
            }
            for (let i = 0; i < friendships.blocked.length; i++) {
                if (friendships.blocked[i].id == dt.data.user_id) {
                    friendships.blocked[i].avatar = dt.data.avatar
                    return Object.create(friendships)
                }
            }
            for (let i = 0; i < friendships.sent.length; i++) {
                if (friendships.sent[i].id == dt.data.user_id) {
                    friendships.sent[i].avatar = dt.data.avatar
                    return Object.create(friendships)
                }
            }
            for (let i = 0; i < friendships.received.length; i++) {
                if (friendships.received[i].id == dt.data.user_id) {
                    friendships.received[i].avatar = dt.data.avatar
                    return Object.create(friendships)
                }
            }
            return friendships
        })

        g_setChatlist((chats) => {
            for (let i = 0; i < chats.length; i++) {
                for (let y = 0; y < chats[i].users.length; y++) {
                    if (chats[i].users[y].id == dt.data.user_id) {
                        chats[i].users[y].avatar = dt.data.avatar
                        return [...chats]
                    }
                }
            }
            return chats
        })
    } else if (dt.kind == "USER_NAME_UPDATED") {
        g_setUserData((userdata) => {
            if (userdata.id == dt.data.user_id) {
                userdata.username = dt.data.username
                return Object.create(userdata)
            }
            return userdata
        }) 

        g_setFriendships((friendships) => {
            for (let i = 0; i < friendships.friends.length; i++) {
                if (friendships.friends[i].id == dt.data.user_id) {
                    friendships.friends[i].username = dt.data.username
                    return Object.create(friendships)
                }
            }
            for (let i = 0; i < friendships.blocked.length; i++) {
                if (friendships.blocked[i].id == dt.data.user_id) {
                    friendships.blocked[i].username = dt.data.username
                    return Object.create(friendships)
                }
            }
            for (let i = 0; i < friendships.sent.length; i++) {
                if (friendships.sent[i].id == dt.data.user_id) {
                    friendships.sent[i].username = dt.data.username
                    return Object.create(friendships)
                }
            }
            for (let i = 0; i < friendships.received.length; i++) {
                if (friendships.received[i].id == dt.data.user_id) {
                    friendships.received[i].username = dt.data.username
                    return Object.create(friendships)
                }
            }
            return friendships
        })

        g_setChatlist((chats) => {
            for (let i = 0; i < chats.length; i++) {
                for (let y = 0; y < chats[i].users.length; y++) {
                    if (chats[i].users[y].id == dt.data.user_id) {
                        chats[i].users[y].username = dt.data.username
                        return [...chats]
                    }
                }
            }
            return chats
        })
    }
}

function onClose() {
    if (g_userdata !== null) {
        if (g_wait_for_reconnect_id === null)
            g_wait_for_reconnect_id = window.display_notif("loading", i18next.t("ws.reconnecting"), 0)
        ws = null
        setTimeout(connect_ws, 5000);
    }
}

function connect_ws() {
    if (ws === null && g_userdata !== null){
        const koukis = new Cookies()
        const token = koukis.get('client_token')

        if(token !== undefined) {
            ws = new WebSocket(NOTIF_BASE_WS + token)
            ws.onmessage    = onMessage
            ws.onclose      = onClose
            ws.onopen       = onOpen
        } else {
            window.undisplay_notif(g_wait_for_reconnect_id)
        }
    }
}

function onOpen() {
    window.undisplay_notif(g_wait_for_reconnect_id)
    g_wait_for_reconnect_id = null
}

function InitNotifs({}) {
    const {setFriendships}      = useContext(FriendshipContext)
    const {setUserdata, userdata}         = useContext(UserDataContext)
    const {setMessages, setChatid, chatid, setChatlist} = useContext(ChatContext)
    const Navigate = useNavigate();
    g_setUserData       = setUserdata
    g_setFriendships    = setFriendships
    g_setMessages       = setMessages
    g_chatid            = chatid
    g_setChatlist       = setChatlist
    g_setChatid         = setChatid
    g_userdata          = userdata
    g_navigate          = Navigate

    useEffect(() => {}, [userdata])

    if (userdata === null && ws !== null) {
        ws.close()
        ws = null
        window.undisplay_notif(g_wait_for_reconnect_id)
    }

    if (ws === null && userdata !== null){
        connect_ws()
    }
    return <></>
}

export default InitNotifs
