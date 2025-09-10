import Modal from "./Modal"
import React, { useContext, useEffect } from 'react';
import { FriendshipContext } from './FriendshipContext.jsx'
import easy_req from "./easy_req";
import { ChatContext } from './ChatContext.jsx'
import GetFriends from "./GetFriends.jsx";
import { UserDataContext } from "./UserDataContext.jsx";
import GetChatList from "./GetChatList.jsx";
import { useTranslation } from "react-i18next";




function NewChatModal() {
	const { userdata, setUserdata } = useContext(UserDataContext)
	const { friendships, setFriendships } = useContext(FriendshipContext)
	const { setChatid,  setChatlist } = useContext(ChatContext)
	const { t, i18n } = useTranslation();

	useEffect(
		() => {
			if (userdata != null) {
				GetFriends(setUserdata, setFriendships, false)
			}
		},
		[userdata])

		const makeNewChat = (usernm) => {
			const error_p = document.getElementById("newchat-error")
			error_p.innerText = ""
			easy_req("/chats/create", { username: usernm }, null,
				(data, _) => {
					if (data.success == true) {
						setChatid(data.data.id)
						GetChatList(setUserdata, setChatlist, null)
						window.$("#newchat-modal").modal("hide")
					}
					else {
						error_p.innerText = data.message
					}
				}, null, setUserdata);
		}

		const MakeNewChatFromInput = () => {
			makeNewChat(document.getElementById("newchat-username-id").value)
		}

	return <Modal title={t("new.chat.modal.title")} id="newchat-modal">
		{friendships ? (
			<>
			<p id="newchat-error" style={{color: "red"}}></p>
			<div className="d-flex">
				<input placeholder={t("new.chat.modal.input.placeholder")} id="newchat-username-id" style={{marginTop:"0px"}}></input>
				<button type="button" className="btn btn-success" style={{marginLeft: "20px", marginTop: "0px"}} onClick={MakeNewChatFromInput}>{t("chat.modal.invite-chat.button")}</button>
			</div>
			<div style={{marginTop: "1em"}}>
				{friendships.friends.map((friendship) => (
					<div key={friendship.id} onClick={() => makeNewChat("id:" + friendship.id)}>
						<img style={{display: "inline", width: "3em", height: "3em"}} src={friendship.avatar} className="rounded-circle"  ></img>
						<p style={{display: "inline", marginLeft: "1em"}} >{t("new.chat.modal.invite", {username: friendship.username})}</p>
					</div>
				))}
			</div></>
		) : (
			<p>{t("new.chat.modal.nofriends")}</p>
		)}
	</Modal>
}

export default NewChatModal

