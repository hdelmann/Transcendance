import { Fragment, useContext, useEffect } from "react"
import { useState } from "react"
import { UserDataContext } from "./UserDataContext"
import GetChatList from "./GetChatList"
import { ChatContext } from "./ChatContext"
import easy_req from './easy_req.jsx';
import React, { useRef } from 'react';
import { Link, useLocation } from "react-router-dom"
import { GamingContext } from './GamingContext.jsx'
import Cookies from "universal-cookie"
import { useTranslation } from "react-i18next"
import { FriendshipContext } from "./FriendshipContext.jsx"

const HEADER_HEIGHT = 40
const CHAT_WIDTH = 360
const BODY_HEIGHT = 360
const CHAT_PROMPT_HEIGHT = 40
const CHAT_BODY_HEIGHT = BODY_HEIGHT - CHAT_PROMPT_HEIGHT

var isMsgSent = false

function ChatComponent() {
	const { chatid, setChatid, chatlist, setChatlist, messages, setMessages } = useContext(ChatContext)
	const { userdata, setUserData } = useContext(UserDataContext);
	const [isReady, setIsReady] = useState(false);
	const { gaming, setGaming } = useContext(GamingContext);
	const [isCollapsed, setIsCollapsed] = useState(true);
	const {friendships} = useContext(FriendshipContext)
	const dummy = useRef();
	const { t, i18n } = useTranslation();
	const location = useLocation();
	const observer = new MutationObserver(() => {
		dummy.current?.scrollIntoView({ behavior: isMsgSent ? "smooth" : "instant" })
		isMsgSent = false
	});

	const newChat = () => {
		window.$("#newchat-modal").modal("show")
	}

	useEffect(() => {
		if (userdata != null && isReady == false) {
			GetChatList(setUserData, setChatlist, setIsReady)
		} else if (userdata == null && isReady) {
			setIsReady(false)
			setChatid(0)
		}

		if (chatid != 0) {
			easy_req("/chats/" + chatid + "/messages", null, null,
				(data, _) => {
					if (data.success == true) {
						setMessages(data.data)
						observer.observe(document.getElementById("chat-scroll"), {
							childList: true
						})
					} else {
						setChatid(0)
					}
				}, null, setUserData);
		}
		else {
			isMsgSent = false
		}
	}, [userdata, chatid])

	// sort chats
	var sorted_chats = [...chatlist]
	sorted_chats.sort((a, b) => {
		const get_val = (a) => {
			if (a.last_message === null)
				return "!" + a.created_at
			return "!" + a.last_message.sent_at
		}
		return get_val(a) < get_val(b)
	})

	// sort messages
	// 1. remove duplicates
	var sorted_messages = Array.from((new Map(messages.map(msg => [msg.id, msg]))).values());
	// 2. sort
	sorted_messages.sort((a, b) => a.id - b.id)
	const send_message = (game_id, tournament_key) => {
		console.log(game_id)
		const message = document.getElementById("chat-message-input").value
		if (document.getElementById("chat-message-input").value == '') {
			return
		}
		document.getElementById("chat-message-input").value = ''
		easy_req("/chats/" + chatid + "/send", {
			"message": message,
			"game_key": game_id,
			"tournament_key": tournament_key
		}, chatid, (data, old_chatid) => {
			if (data.success == true) {
				// in case the user changes the focused chat before it replies
				if (old_chatid == chatid) {
					isMsgSent = true
					setMessages([...messages, data.data])
				}
			} else {
				window.display_notif("error", t("chat.error.message.not.sent", {error: data.message}))
			}
		}, null, setUserData);
	}
	const handleKeyDown = (event) => {
		if (event.key === 'Enter') {
			isMsgSent = true
			send_message()
		}
	}

	const IsRecipientBlocked = (chat) => {
		const recipient_id = userdata.id == chat.users[0].id ?
								chat.users[1].id : chat.users[0].id

		for (let i = 0; i < friendships["blocked"].length; i++) {
			const blocked = friendships["blocked"][i];
			if (blocked.id == recipient_id)
				return true
		}
		return false
	}

	return <>
		{(isReady && userdata !== null) ?
			<div id="chat-box" style={{
				backgroundColor: "#313539",
				width: CHAT_WIDTH + "px",
				position: "fixed",
				height: (HEADER_HEIGHT + BODY_HEIGHT) + "px",
				right: "50px",
				transition: "bottom 0.30s ease-out",
				bottom: isCollapsed ? (-BODY_HEIGHT) + "px" : "0px",
				zIndex: "10"
			}}>
				<div className="uparr" style={{ width: CHAT_WIDTH + "px", position: "initial", top: "0", height: HEADER_HEIGHT + "px" }}>
					<p style={{ marginTop: "0px", fontSize: "30px" }}>
						{isCollapsed == false ?
							<>
								<i className="bi-arrow-bar-down bi position-absolute top-0 start-50 translate-middle-x" style={{ fontSize: "30px", position: "central" }} onClick={() => setIsCollapsed(true)} />
								{chatid != 0 && <i className="bi bi-arrow-left position-absolute top-0 start-0" style={{ fontSize: "20px", marginTop: "5px" }} onClick={() => { setChatid(0); setMessages([]) }} />}
							</> :
							<>
								<i className="bi-arrow-bar-up position-absolute top-0 start-50 translate-middle-x" style={{ fontSize: "30px" }} onClick={() => setIsCollapsed(false)} />
							</>}
					</p>
				</div>
				{chatid === 0 ? (
					<div className="list-group" style={{ overflowY: "auto", height: BODY_HEIGHT + "px" }}>
						<button className="btn btn-secondary agradient" style={{ width: CHAT_WIDTH + "px", padding: "0px", borderRadius: "5% 5% 0% 0%" }} type="button" onClick={newChat}><i className="bi bi-person-add" style={{ fontSize: "24px" }}></i></button>
						{sorted_chats.map((chat) =>
							<Fragment key={chat.id}>
							{IsRecipientBlocked(chat) == false &&
							<li onClick={() => setChatid(chat.id)} className="list-group-item">
								<div className="row">
									<div className="col-sm-2"><img className="rounded-circle" src={(userdata.id == chat.users[0].id ? chat.users[1].avatar : chat.users[0].avatar)} style={{ height: "40px", margin: "auto" }}></img></div>
									<div className="col-sm-10"><p style={{ marginTop: "9px" }}><DisplayChatname userdata={userdata} chat={chat} /></p></div>
								</div>
							</li>}
							</Fragment>
						)}
					</div>
				) : (
					<>
						<div className="position-absolute top-0 start-0" style={{ marginTop: "5px", marginLeft: "21px" }}>
							<>{chatlist.map((chat) => chat.id == chatid && <Fragment key={chat.id}>
									<img src={(userdata.id == chat.users[0].id ? chat.users[1].avatar : chat.users[0].avatar)} className="rounded-circle" style={{ height: "30px", margin: "auto" }} />
									<p className="position-absolute top-0 start-0" style={{ marginLeft: "40px", marginTop: "3px" }}> <DisplayChatname userdata={userdata} chat={chat} clickable={true} /></p>
								</Fragment>
							)}</>
						</div>
						<div id="chat-scroll" style={{ overflowY: "auto", backgroundColor: "rgb(49, 51, 56)", height: CHAT_BODY_HEIGHT + "px", position: "absolute", top: HEADER_HEIGHT + "px", width: CHAT_WIDTH + "px" }}>
							{sorted_messages.map((msg) =>
								<Fragment key={msg.id}>
									<div style={{ display: "flex", justifyContent: "flex-" + ((userdata.id == msg.sender.id) ? "end" : "start"), margin: "0.5em" }}>
										<div className={"bubble " + ((userdata.id == msg.sender.id) ? "right" : "left")} style={{ wordWrap: "break-word" }}>
											<p style={{ margin: "0px" }} >{msg.content}</p>
										</div>
									</div>
									{msg.game_key !== null &&
										<>
											{(userdata.id == msg.sender.id) ?
												<p style={{ fontStyle: "italic", textAlign: "center" }}>{t("chat.game-invite.button")}</p>
												:
												<>
													<p style={{ fontStyle: "italic", textAlign: "center" }}>{t("chat.game-invite-r.notif")}<br />
														<span onClick={ () => {
														if (location.pathname.startsWith('/tournament/')) {
															window.display_notif("info", t("game.error.in.tournament"), 5)
															return
														}
													    const cookies = new Cookies()
			             								setGaming();
														window.start_game(msg.game_key, cookies.get('client_token'), true)
													}} className="brightness-on-hover" style={{ fontSize: "0.90em", marginBottom: "0px", cursor: "pointer" }}>{t("chat.join-game.button")}</span></p>
												</>
											}
										</>
									}
									{msg.tournament_key !== null && 
									<>
										{(userdata.id == msg.sender.id) ?
										<p style={{fontStyle: "italic", textAlign: "center"}}>{t("chat.tournament-invite.button")}</p>
										:
										<>
											<p style={{ fontStyle: "italic", textAlign: "center"}}>
											<Link className="brightness-on-hover"  style={{ textDecoration: 'none', color: 'white' }} to={`/tournament/` + msg.tournament_key}>{t("chat.tournament-invite-r.notif")}</Link><br/></p>
										</>
									}
									</>}
								</Fragment>)}

							<div ref={dummy} />
						</div>
						<div style={{ color: "isVisible", backgroundColor: "blue", width: CHAT_WIDTH + "px", position: "absolute", bottom: "0", height: HEADER_HEIGHT + "px", borderRadius: "0px" }}>
							<form autoComplete="off" method="post" action="javascript:void(0);">
								<input name="hidden" type="text" autoComplete="chrome-off" id="chat-message-input" onKeyDown={handleKeyDown} style={{ width: (CHAT_WIDTH - 40), height: (CHAT_PROMPT_HEIGHT) + "px" }}></input>
							</form>

							<div className="myDIV"><button onClick={() => { send_message(null, null) }} className="btn btn-secondary" style={{ height: "40px", width: "40px", borderRadius: "0px", position: "absolute", right: "0px", bottom: "0px" }} type="button"><i className="bi bi-send-check"></i></button></div>
							{gaming && gaming.type === "custom_game" && window.game_ws != null &&
								<div className="hide"><button onClick={() => { send_message(gaming.uuid, null) }} className="btn btn-secondary" style={{ height: "40px", width: "40px", borderRadius: "0px", position: "absolute", right: "0.0px", bottom: "40px" }} type="button"><i className="bi bi-controller"></i></button></div>
							}
							{gaming && gaming.type === "tournament" &&
								<div className="hide"><button onClick={() => { send_message(null, gaming.uuid) }} className="btn btn-secondary" style={{ height: "40px", width: "40px", borderRadius: "0px", position: "absolute", right: "0.0px", bottom: "40px" }} type="button"><i className="bi bi-trophy"></i></button></div>
							}
						</div>
					</>
				)}
			</div> : <></>
		}
	</>
}

function DisplayChatname({ userdata, chat, clickable }) {
	if (clickable == true)
		return userdata.id == chat.users[0].id ?
			<Link style={{ textDecoration: 'none', color: 'white' }} to={"/profile/id:" + chat.users[1].id}>{chat.users[1].username}</Link> :
			<Link style={{ textDecoration: 'none', color: 'white' }} to={"/profile/id:" + chat.users[0].id}>{chat.users[0].username}</Link>

	return userdata.id == chat.users[0].id ?
		<>{chat.users[1].username}</> :
		<>{chat.users[0].username}</>
}

export default ChatComponent
