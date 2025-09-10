import Modal from './Modal.jsx'
import Root from './Root.jsx'
import React, { useContext } from 'react';
import { UserDataContext } from './UserDataContext';
import Cookies from 'universal-cookie';
import easy_req from './easy_req.jsx';
import { useTranslation } from 'react-i18next';
import initlogin from './initLogin.jsx';

function onLogin(setUserdata) {
    const login = document.getElementById("login-form-login").value
    const password = document.getElementById("login-form-password").value
	const error_p = document.getElementById("login-form-error")
	error_p.innerText = ""

    easy_req("/auth/connect", {
	"login": login,
	"password": password
    }, null, (data, _) => {
	if (data.success == false)
		error_p.innerText = data.message
	else
	{
	    const cookies = new Cookies()
	    cookies.set("client_token", data.data.token, {maxAge: 60*60*10, path: "/"})
	    initlogin(setUserdata)
	    window.$("#login-modal").modal("hide")
	}
    })
}

function LoginModal() {
    const { userdata, setUserdata } = useContext(UserDataContext);
    const { t, i18n } = useTranslation();
    const buttons=[{
	name: t("login.modal.login.button"),
	handler:() => onLogin(setUserdata)},
		   {
		       name: t("modals.close"),
		       handler:() => window.$("#login-modal").modal("hide")
		   }
		  ]

    const handleKeyDown = (event) => {
	if (event.key === 'Enter') {
	    onLogin(setUserdata)
	}
    }
    return <Modal title={t("login.modal.title")} id="login-modal" buttons={buttons}  >
	       <div className="d-flex align-items-stretch justify-content-evenly">
		   <div>
			    <p id="login-form-error" style={{color: "red"}}></p>
		       <p>{t("login.modal.login.label")}: <br/><input id="login-form-login" onKeyDown={handleKeyDown}/></p>
		       <p>{t("login.modal.password.label")}:<br/><input id="login-form-password" type="password" onKeyDown={handleKeyDown}/></p>
		   </div>
		   <div><a onClick={OAuthLogin}>
			    <img src='/static/42_Logo.svg' width="220" height="220" style={{cursor: "pointer"}}></img>
			</a>
		   </div>
	       </div>
	   </Modal>
}

function OAuthLogin() {
    const cookies = new Cookies()
    const securetoken = window.makeid(15)
    cookies.set('oauth_state', securetoken, {maxAge: 60*5, path: "/"})
    window.location.href = 'https://api.intra.42.fr/oauth/authorize?client_id='
	+ encodeURIComponent(window.OAUTH_CLIENT_ID) + '&redirect_uri=' +
	encodeURIComponent(window.OAUTH_CALLBACK) + '&response_type=code&state='
	+ encodeURIComponent(securetoken)
}
export default LoginModal
