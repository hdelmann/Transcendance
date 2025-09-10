import { useTranslation } from "react-i18next"
import Modal from "./Modal"
import Register from "./RegisterHandler"

function onRegister() {
	const username = document.getElementById('register-form-uname').value
	const email = document.getElementById('register-form-email').value
	const password = document.getElementById('register-form-password').value
	const cpassword = document.getElementById('register-form-cpassword').value
	Register(username, email, password, cpassword)
}

function RegisterModal() {
	const {t} = useTranslation()
	const buttons=[{
		name: t("register.modal.register.button"),
		handler:onRegister},
		{
		  name: t("modals.close"),
		  handler:() => window.$("#register-modal").modal("hide")
		}
	  ]
	const handleKeyDown = (event) => {
		if (event.key === 'Enter') {
		  onRegister()
		}
	  }
	return <Modal title={t("register.modal.title")} id="register-modal" buttons={buttons}>
	<p id="register-form-error" style={{color: "red"}}></p>
	<p>{t("register.modal.username.label")}:<br/><input id="register-form-uname" onKeyDown={handleKeyDown}/></p>
	<p>{t("register.modal.email.label")}: <br/><input id="register-form-email" onKeyDown={handleKeyDown}/></p>
	<p>{t("register.modal.password.label")}:<br/><input type="password" id="register-form-password" onKeyDown={handleKeyDown}/></p>
	<p>{t("register.modal.password.confirm.label")}:<br/><input type="password" id="register-form-cpassword" onKeyDown={handleKeyDown}/></p>
	</Modal>
}

export default RegisterModal