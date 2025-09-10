import React, { useContext } from 'react';
import { UserDataContext } from './UserDataContext';
import Cookies from 'universal-cookie';
import { FriendshipContext } from './FriendshipContext';
import GetFriends from './GetFriends';
import { Link, useNavigate } from 'react-router-dom';
import LanguageSelector from './LanguageSelector';
import { useTranslation } from 'react-i18next';
import { GamingContext } from './GamingContext.jsx';

function Disconnect(setUserdata) {
    const cookies = new Cookies()
    cookies.remove("client_token")
    cookies.update()
    setUserdata(null)
}

function Menu({userdata}) {
    const { t, i18n } = useTranslation();
    const login_toggle=() => {
	window.$("#login-modal").modal('show');
    }
    const register_toggle=() => {
	window.$("#register-modal").modal('show');
    }
    return <header className="navbar-expand-lg  p-1 text-white bg-body-tertiary">
               <div className="container-fluid">
		   <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start">
		       <Link to={"/"} className="navbar-brand fw-bold" href="#">{t("menu.site.title")}</Link>
		       
		       <ul className="nav col-12 col-lg-auto me-lg-auto mb-2 justify-content-center mb-md-0">
			   <LanguageSelector className="nav-link px-2 text-white" ></LanguageSelector>
			   {/*
			   <li className="nav-link px-2 text-white dropdown">
                               <a className="nav-link px-2 text-white dropdown dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">Tournaments</a>
                               <ul className="dropdown-menu">
				   <li><a className="dropdown-item" href="#">Upcomming Tournaments</a> </li>
				   <li>
                                       <hr className="dropdown-divider"/>
				   </li>
				   <li><a className="dropdown-item" style={{color: "rgb(81,180,81)"}} href="#">Sign up</a> </li>
                               </ul>
			   </li>
			    */}
		       </ul>
			   
			   { userdata === null ? (
			       <div className="text-end">
				   <button type="button" className="btn btn-outline-light me-2" onClick={login_toggle}>{t("menu.button.login")}</button>
				   <button type="button" className="btn btn-warning" onClick={register_toggle}>{t("menu.button.register")}</button>
			       </div>
			   ) : (
			       <ProfileButton/>
			   )}
		   </div>
               </div>
	   </header>
}

function ProfileButton() {
    const { userdata, setUserdata } = useContext(UserDataContext);
    const { friendships, setFriendships} = useContext(FriendshipContext)
    const { t, i18n } = useTranslation();
	const navigate = useNavigate();
    const settings_toggle=() => {
		navigate('/');
		window.$("#settings-modal").modal('show');
    }
    const disconnect_handler=() => {
	Disconnect(setUserdata)
    }
    const friends_handler= () => {
	GetFriends(setUserdata, setFriendships, true)
    }
    return <div className="dropdown text-end align-items-center mb-md-0">
	       <a  href="#" className=" d-block text-decoration-none" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
		   <img src={userdata.avatar}  alt={userdata.username} width="45" height="45" className="rounded-circle"/> 
	       </a>
	       <ul className="dropdown-menu text-small" aria-labelledby="dropdownUser1" >
		   <Link to={`/profile/@me`} className="dropdown-item">
		       {userdata.username}
		   </Link>
		   <li><a className="dropdown-item" id="friends-modal-toggle" onClick={friends_handler} href="#">{t("menu.profile.friends.button")}</a></li>
		   <li><a className="dropdown-item" onClick={settings_toggle} href="#">{t("menu.profile.settings.button")}</a></li>
		   <li>
		       <hr className="dropdown-divider"/>
		   </li>
		   <li><a className="dropdown-item" style={{color: "red"}} onClick={disconnect_handler} href="#">{t("menu.profile.disconnect.button")}</a></li>
	       </ul>
	   </div>
}

export default Menu
