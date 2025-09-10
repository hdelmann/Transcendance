import easy_req from "./easy_req";

function Register(username, email, password, cpassword) {
	const error_p = document.getElementById("register-form-error")
	error_p.innerText = ""
	
	if (password != cpassword) {
		error_p.innerText = T("register.modal.password.not.match")
		return
	}
	easy_req("auth/register",
		{"username": username,
		"email": email,
		"password": password,
	}, null,
		(data, _) => {
		if (data.success == false)
			error_p.innerText = data.message
		else
		{
			window.$("#register-modal").modal('hide');
			window.$("#login-modal").modal('show');
		}
	})
}

export default Register