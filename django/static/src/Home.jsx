import React, { useContext, useState } from 'react';
import { UserDataContext } from './UserDataContext';
import { useTranslation } from 'react-i18next';
import easy_req from './easy_req';
import Cookies from 'universal-cookie';
import { useNavigate } from 'react-router-dom';
import { GamingContext } from './GamingContext';
import { CustomGameContext } from './CustomGameContext';

function Home() {
	const { userdata, setUserdata } = useContext(UserDataContext);

	return userdata === null ?
		<AnonymousHome />
		:
		<RegisteredHome />

}


function RegisteredHome(params) {
	const { t, i18n } = useTranslation();
	const [tournamentID, setTournamentID] = useState('');
	const cookies = new Cookies()
	const token = cookies.get('client_token')
	const navigate = useNavigate();
	const { gaming, setGaming } = useContext(GamingContext)
	const { setUserdata } = useContext(UserDataContext)
	const { setCustomGameNextStep } = useContext(CustomGameContext)


	const search_game = () => {
		easy_req("/game/search", "", null, (data, _) => {
			if (data.success == true) {
				window.$("#game-modal").modal("hide")
				setGaming({ "type": "matchmaking_game", "uuid": data.data.party_uuid });
				window.start_game(data.data.party_uuid, token, true)
			}
		}, null, setUserdata);
	}
	const create_game = () => {
		setCustomGameNextStep("game")
		window.$("#game-customization-modal").modal("show")
	}
	const search_tournament = () => {
		easy_req("/tournament/search", "", null, (data, _) => {
			if (data.success == true) {
				navigate("/tournament/" + data.data.tournament);
			}
		}, null, setUserdata);

	}
	const create_tournament = () => {
		setCustomGameNextStep("tournament")
		window.$("#game-customization-modal").modal("show")
	}

	return <>

		<div style={{
			backgroundSize: "cover",
			backgroundRepeat: "no-repeat",
			height: "42.7em",
			paddingTop: "300px",
			textAlign: "center" // Adjust the height as needed
		}}>
			<img src='/static/pongv.png' className='center' style={{ marginBottom: "7em" }}></img>
			<div className="d-flex justify-content-center">
				<button onClick={search_game} className="bene-button" style={{}}><span>{t("home.button.search.match")}</span></button>
				<br></br>
				<button onClick={search_tournament} className="bene-button"><span>{t("home.button.search.tournament")}</span></button>
			</div>
			<br />
			<div className="d-flex justify-content-center">

				<button onClick={create_game} className="bene-button"><span>{t("home.button.create.match")}</span></button>
				<br></br>
				<button onClick={create_tournament} className="bene-button"><span>{t("home.button.create.tournament")}</span></button>
			</div>
		</div>
	</>
}

function AnonymousHome() {
	const { t, i18n } = useTranslation();
	const login_toggle = () => {
		window.$("#login-modal").modal('show');
	}
	const register_toggle = (event) => {
		window.$("#register-modal").modal('show');
	}
	return <>
		<div style={{
			backgroundSize: "cover",
			backgroundRepeat: "no-repeat",
			height: "100vh",
			paddingTop: "150px",
			textAlign: "center"
		}}> <img src='/static/pongv.png' style={{ marginBottom: "7em" }}></img> <h3 style={{ textAlign: "center", fontSize: "40px", fontFamily: "courier, monospace" }}>{t("home.motto")}</h3>
			<div style={{ width: "550px", display: "block", margin: "auto", marginTop: "20vh" }}>  <div className="d-flex align-items-between justify-content-center">
				<button className="bene-button" onClick={login_toggle}><span>{t("home.login.button")}</span></button> <p style={{ fontSize: "30px", marginTop: "0.7em" }}>  {t("home.or")}  </p>  <button className="bene-button" onClick={register_toggle}><span>{t("home.register.button")}</span></button>
			</div>
			</div>
		</div>
	</>

}


export default Home
