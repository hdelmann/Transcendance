import Modal from './Modal.jsx'
import React, { useContext } from 'react';
import { FriendshipContext } from './FriendshipContext.jsx'
import AddFriend from './AddFriend.jsx';
import { UserDataContext } from './UserDataContext.jsx';
import RemoveFriend from './RemoveFriend.jsx';
import UnblockUser from './UnblockUser.jsx';
import BlockUser from './BlockUser.jsx';
import { GamingContext } from './GamingContext.jsx'
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function onAddFriend(setUserdata, setFriendships) {
    const friend = document.getElementById("friends-add-friend").value
    AddFriend(setFriendships, setUserdata, friend, "friends-pending-error")
}

function onBlockUser(setUserdata, setFriendships) {
    const user = document.getElementById("friends-block-user").value
    BlockUser(setFriendships, setUserdata, user, "friends-block-error")
}

function FriendsModal() {
    const { t, i18n } = useTranslation();
    const { friendships, setFriendships} = useContext(FriendshipContext)
    const {userdata, setUserdata} = useContext(UserDataContext)
    return <Modal title={t("friends.modal.title")} id="friends-modal" noImplicitBody={true}>
               <div className="modal-body">
                   <p> {t("friends.modal.friendlist.title")}</p>
                   <p id="friends-list-error" style={{ color: "red" }}></p>
                   {friendships.friends.length == 0 ? 
                    <p style={{color: "grey"}}>{t("friends.modal.no-friends")}</p> : 
                    <FriendList friends={friendships.friends}/>}
               </div>
               <hr style={{margin: "0px"}}/>
               <div className="modal-body">
                   <p> {t("friends.modal.add-friends.title")}</p>
                   <p id="friends-pending-error" style={{ color: "red" }}></p>
                   <div className='d-flex'>
                       <input className="form-control me-2"  placeholder="Username" id="friends-add-friend" aria-label="Add"/>
                       <button className="btn btn-outline-success" type="sFdisubmit" onClick={() => onAddFriend(setUserdata, setFriendships)}>{t("friends.modal.add.button")}</button>
                   </div>
                   {(friendships.received.length + friendships.sent.length) == 0 ? 
                    <p style={{marginTop: "10px", color: "gray"}}>{t("friends.modal.no-pending-invites")}</p> : 
                    <PendingFriends received={friendships.received} sent={friendships.sent}/>
                   }
               </div>
               <hr style={{margin: "0px"}}/>
               <div className="modal-body">
                   <p>{t("friends.modal.blocked.title")}</p>
                   <p id="friends-block-error" style={{ color: "red" }}></p>
                   <div className='d-flex'>
                       <input className="form-control me-2" id='friends-block-user' placeholder="Username"/>
                       <button className="btn btn-outline-danger"  type="sFdisubmit" onClick={() => onBlockUser(setUserdata, setFriendships)}>{t("friends.modal.blocked.block-button")}</button>
                   </div>
                   {friendships.blocked.length == 0 ? 
                    <p style={{marginTop: "10px", color: "grey"}}>{t("friends.modal.blocked.non-blocked")}</p> : 
                    <BlockedUsers blockeds={friendships.blocked}/>}
               </div>    
	   </Modal>
}


function BlockedUsers({blockeds}) {
    const { t, i18n } = useTranslation();
    const { friendships, setFriendships} = useContext(FriendshipContext)
    const {userdata, setUserdata} = useContext(UserDataContext)
    return <>
	       <div className="container text-center" style={{marginTop: "10px"}}> 
		   {
		       blockeds.map((blocked) => <div key={blocked.id} className='row' style={{margin: "0.5em"}}>
						     <div className="col-sm-2"><img src={blocked.avatar} style={{height: "40px"}}/></div>
						     <div className="col-sm-7"><Link style={{textDecoration: "none", color: "white"}} to={"/profile/id:"+blocked.id}><p style={{fontSize: "15px",display: "block",margin: "auto",marginTop: "9px"}}>{blocked.username}</p></Link></div>
						     <div className="col-sm-3"><button className='btn btn-outline-danger' style={{fontSize: "15px",padding: "7px"}} onClick={() => UnblockUser(setFriendships, setUserdata, "id:"+blocked.id, "friends-block-error")}>{t("friends.modal.blocked.unblock.button")}</button></div>
						 </div>)
		   }
	       </div>
	   </>
}1

function FriendList({friends}) {
    const { t, i18n } = useTranslation();
    const {setFriendships} = useContext(FriendshipContext)
    const {setUserdata} = useContext(UserDataContext)

    const status2color = (status) => {
        switch (status) {
            case "online":  return "#00FF00";
            case "offline": return "#FF0000";
            case "ingame":  return "#0000FF";
            default:        return "#AAAAAA";
        }
    }

    const status2title = (status) => {
        switch (status) {
            case "online":  return t("user.status.online.title");
            case "offline": return t("user.status.offline.title");
            case "ingame":  return t("user.status.ingame.title");
            default:        return t("user.status.unknown.title");
        }
    }

    return <>
               {
		   friends.map((friendship) => <div key={friendship.id} className='row' style={{margin: "0.5em"}}>
						   <div className="col-sm-2 rounded-circle"><img className='rounded-circle' src={friendship.avatar} style={{height: "40px"}}/></div>
						   <div className="col-sm-7"><p style={{fontSize: "15px",display: "block",margin: "auto",marginTop: "9px"}}>
										 <i className="bi bi-record-fill" style={{color: status2color(friendship.status)}} title={status2title(friendship.status)}/>
									     <Link style={{textDecoration: "none", color: "white"}} to={"/profile/id:"+friendship.id}> {friendship.username}</Link></p></div>
						   <div className="col-sm-3"><button className='btn btn-outline-danger' style={{fontSize: "15px",padding: "7px"}} onClick={() => RemoveFriend(setFriendships, setUserdata, "id:"+friendship.id, "friends-list-error")}>{t("friends.modal.remove.button")}</button></div>
					       </div> ) 
               }
	   </>
}

function PendingFriends({received, sent}) {
    const { t, i18n } = useTranslation();
    const { friendships, setFriendships} = useContext(FriendshipContext)
    const {userdata, setUserdata} = useContext(UserDataContext)
    return <>
               {
		   received.map((friendship) => <div key={friendship.id} className="row" style={{margin: "0.5em"}}>
						    <div className="col-sm-2"><img className="rounded-circle" src={friendship.avatar} style={{height: "40px"}}/></div>
						    <div className="col-sm-6"><p style={{fontSize: "15px",display: "block",margin: "auto",marginTop: "9px"}}>
									      <Link style={{textDecoration: "none", color: "white"}} to={"/profile/id:"+friendship.id}>{friendship.username}</Link></p></div>
						    <div className="col-sm-2"><button className='btn btn-outline-danger' style={{fontSize: "15px",padding: "7px"}} onClick={() => RemoveFriend(setFriendships, setUserdata, "id:"+friendship.id, "friends-pending-error")}>{t("friends.modal.refuse.button")}</button></div>
						    <div className="col-sm-2"><button className='btn btn-outline-success' style={{fontSize: "15px",padding: "7px"}} onClick={() => AddFriend(setFriendships, setUserdata, "id:"+friendship.id, "friends-pending-error")}>{t("friends.modal.accept.button")}</button></div>

						</div>)
               }
               {
                   sent.map((friendship) => <div key={friendship.id} className='row' style={{margin: "0.5em"}}>
						<div className="col-sm-2"><img className="rounded-circle" src={friendship.avatar} style={{height: "40px"}}/></div>
						<div className="col-sm-7"><p style={{fontSize: "15px",display: "block",margin: "auto",marginTop: "9px"}}>
									  <Link style={{textDecoration: "none", color: "white"}} to={"/profile/id:"+friendship.id}>{friendship.username}</Link></p></div>
						<div className="col-sm-3"><button className='btn btn-outline-danger' style={{fontSize: "15px",padding: "7px"}} onClick={() => RemoveFriend(setFriendships, setUserdata, "id:"+friendship.id, "friends-pending-error")}>{t("friends.modal.cancel.button")}</button></div>
					    </div>)
               }
	   </>
}
export default FriendsModal
