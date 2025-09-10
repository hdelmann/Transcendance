import { useContext } from "react";
import Modal from "./Modal";
import { UserDataContext } from "./UserDataContext";
import easy_req_raw from "./easy_req_raw";
import easy_req from "./easy_req";
import Cookies from "universal-cookie";
import { useTranslation } from "react-i18next";
import i18next, { t } from "i18next";

function onAvatarChange(event, setUserdata) {
	var error_p = window.$("#settings-avatar-error")[0]
	var success_p = window.$("#settings-avatar-success")[0]
	const files = event.target.files
	error_p.innerText = ""
	success_p.innerText = ""

	if (files.length == 0) {
		error_p.innerText = i18next.t("settings.modal.avatar.file.needed")
		return
	} else if (files.length > 1) {
		error_p.innerText = i18next.t("settings.modal.avatar.file.needed.one")
		return
	} else if (files[0].size == 0) {
		error_p.innerText = i18next.t("settings.modal.avatar.file.empty")
		return
	} else if (files[0].size > 1_000_000) {
		error_p.innerText = i18next.t("settings.modal.avatar.file.too.big")
		return
	}

	easy_req_raw("user/@me/set_avatar", files[0], null,
		(data, _) => {
			if (data.success == true) {
				setUserdata((u) => {
					u.avatar = "/api/user/id:" + u.id + "/avatar?rnd=" + Math.random() // force the browser to reload
					return Object.create(u)
				})
				success_p.innerText = i18next.t("settings.modal.avatar.changed")
			} else {
				error_p.innerText = data.message
			}
		}, null, setUserdata)
}

function onAvatarDelete(setUserdata) {
	var error_p = window.$("#settings-avatar-error")[0]
	var success_p = window.$("#settings-avatar-success")[0]
	error_p.innerText = ""
	success_p.innerText = ""

	easy_req_raw("user/@me/set_avatar", "", null,
		(data, _) => {
			if (data.success == true) {
				setUserdata((u) => {
					u.avatar = "/api/user/id:" + u.id + "/avatar?rnd=" + Math.random() // force the browser to reload
					return Object.create(u)
				})
				success_p.innerText = i18next.t("settings.modal.avatar.deleted")
			} else {
				error_p.innerText = data.message
			}
		}, null, setUserdata)
}

function changeUsername(userdata, setUserdata) {
	const username = document.getElementById("settings-username-input").value
	var error_p = window.$("#settings-username-error")[0]
	var success_p = window.$("#settings-username-success")[0]
	error_p.innerText = ""
	success_p.innerText = ""

	if (userdata.username == username) {
		error_p.innerText = i18next.t("settings.modal.username.same.error")
		return
	}

	easy_req("user/@me?fields=email", { "username": username }, null,
		(data, _) => {
			if (data.success == true) {
				setUserdata(data.data)
				success_p.innerText = i18next.t("settings.modal.username.changed")
			} else {
				error_p.innerText = data.message
			}
		}, null, setUserdata)
}

function changeEmail(userdata, setUserdata) {
	const email = document.getElementById("settings-email-input").value
	var error_p = window.$("#settings-email-error")[0]
	var success_p = window.$("#settings-email-success")[0]
	error_p.innerText = ""
	success_p.innerText = ""

	if (userdata.email == email) {
		error_p.innerText = i18next.t("settings.modal.same.email.error")
		return
	}

	easy_req("user/@me?fields=email", { "email": email }, null,
		(data, _) => {
			if (data.success == true) {
				setUserdata(data.data)
				success_p.innerText = i18next.t("settings.modal.email.changed")
			} else {
				error_p.innerText = data.message
			}
		}, null, setUserdata)
}

function DownloadPersonalData(setUserdata) {
	var error_p = window.$("#settings-password-error")[0]
	error_p.innerText = ""
	
	easy_req("gdpr/new_export", null, null,
		(data, _) => {
			if (data.success == true) {
				window.open(window.location.origin + '/api/gdpr/export/' + data.data.key, '_blank').focus();
			} else {
				error_p.innerText = data.message
			}
		}, null, setUserdata)
}

function DeleteMyAccount(setUserdata) {
	var error_p = window.$("#settings-password-error")[0]
	error_p.innerText = ""
	
	easy_req("gdpr/delete", { "action": "delete" }, null,
		(data, _) => {
			if (data.success == true) {
				const cookies = new Cookies()
				cookies.remove("user_token")
				setUserdata(null)
			} else {
				error_p.innerText = data.message
			}
		}, null, setUserdata)
}

function changePassword(setUserdata) {
	const password = document.getElementById("settings-password-input").value
	const password_confirm = document.getElementById("settings-password-confirm-input").value
	var error_p = window.$("#settings-password-error")[0]
	var success_p = window.$("#settings-password-success")[0]
	error_p.innerText = ""
	success_p.innerText = ""

	if (password != password_confirm) {
		error_p.innerText = i18next.t("settings.modal.password.confirm.not.match")
		return
	}

	easy_req("user/@me?fields=email", { "password": password }, null,
		(data, _) => {
			if (data.success == true) {
				setUserdata(data.data)
				success_p.innerText = i18next.t("settings.modal.password.changed")
			} else {
				error_p.innerText = data.message
			}
		}, null, setUserdata)
}

function SettingsModal() {
	const { userdata, setUserdata } = useContext(UserDataContext)
	const { t, i18n } = useTranslation();
	return <Modal title={t("settings.modal.title")} id="settings-modal" noImplicitBody>
		{userdata !== null && <>
			<div className="modal-body">
			<p> {t("settings.modal.avatar")}</p>
				<label htmlFor="settings-avatar-input"><img src={userdata.avatar} height="100" width="100" /></label>
				<input
					type="file"
					id="settings-avatar-input"
					style={{ visibility: "collapse", position: "fixed", top: "-1000px" }}
					accept="image/png,image/jpeg,image/jpg"
					multiple={false}
					onChange={(event) => onAvatarChange(event, setUserdata)} />
				<p id="settings-avatar-error" style={{ color: "red" }}></p>
				<p id="settings-avatar-success" style={{ color: "green" }}></p>
				<button className='btn btn-outline-danger' onClick={() => {onAvatarDelete(setUserdata)}}>{t("settings.modal.avatar.delete")}</button>
			</div>
			<hr style={{ margin: "0px" }} />
			<div className="modal-body">
				<p> {t("settings.modal.changename.title")}</p>
				<p id="settings-username-error" style={{ color: "red" }}></p>
				<p id="settings-username-success" style={{ color: "green" }}></p>
				<input id="settings-username-input" defaultValue={userdata.username} /><br />
				<button className='btn btn-outline-success'style={{marginTop: "1em"}} onClick={() => changeUsername(userdata, setUserdata)}>{t("settings.modal.change.button")}</button>
			</div>
			<hr style={{ margin: "0px" }} />
			<div className="modal-body">
				<p> {t("settings.modal.changepassword.title")}</p>
				<p id="settings-password-error" style={{ color: "red" }}></p>
				<p id="settings-password-success" style={{ color: "green" }}></p>
				<p>{t("settings.modal.newpassword.label")}<br /><input type="password" id="settings-password-input" placeholder={t("settings.modal.npassword.placeholder")} /></p>
				<p>{t("settings.modal.confirmnewpass.label")}<br /><input type="password" id="settings-password-confirm-input" placeholder={t("settings.modal.cpassword.placeholder")} /></p>
				<button className='btn btn-outline-success' onClick={() => changePassword(setUserdata)}>{t("settings.modal.change.button")}</button>
			</div>
			<hr style={{ margin: "0px" }} />
			<div className="modal-body">
				<p> {t("settings.modal.changemail.title")}</p>
				<p id="settings-email-error" style={{ color: "red" }}></p>
				<p id="settings-email-success" style={{ color: "green" }}></p>
				<p><input id="settings-email-input" defaultValue={userdata.email} /></p>
				<button className='btn btn-outline-success' onClick={() => changeEmail(userdata, setUserdata)}>{t("settings.modal.change.button")}</button>
			</div>
			<hr style={{ margin: "0px" }} />
			<div className="modal-body">
				<p> {t("settings.modal.gdpr.title")}</p>
				<p style={{color: "gray"}}>{t("settings.modal.gdpr.desc")}<br/>
				<a href={t("settings.modal.gdpr.link.url")} target="_blank" rel="noopener noreferrer">{t("settings.modal.gdpr.link.text")}</a></p>
				<p id="settings-gdpr-error" style={{ color: "red" }}></p>
				<button className='btn btn-outline-success' onClick={() => DownloadPersonalData(setUserdata)} style={{ marginRight: "1em" }}>{t("settings.modal.gdpr.download")}</button>
				<button className='btn btn-outline-danger' onClick={() => DeleteMyAccount(setUserdata)}>{t("settings.modal.gdpr.erasedata")}</button>
			</div>
		</>}
	</Modal>
}

export default SettingsModal