import Modal from "./Modal";
import easy_req from "./easy_req";
import { GamingContext } from './GamingContext.jsx'
import { useContext, useEffect } from 'react';
import Cookies from 'universal-cookie';
import { useTranslation } from "react-i18next";
import { CustomGameContext } from "./CustomGameContext.jsx";
import { useNavigate } from "react-router-dom";

function RadioTag({ id, children, name, defaultChecked }) {
	return <>
		<input type="radio" class="btn-check" name={name} id={id} autocomplete="off" defaultChecked={defaultChecked} />
		<label class="btn btn-outline-primary" htmlFor={id}>{children}</label></>
}

function GameCustomizationModal() {
	const { setGaming } = useContext(GamingContext)
	const { customGameNextStep } = useContext(CustomGameContext)
	const cookies = new Cookies()
	const token = cookies.get('client_token')
	const { t, i18n } = useTranslation();
	const Navigate = useNavigate();

	useEffect(() => { }, [customGameNextStep])
	const startCustomGame = () => {
		const checkRadio = (id) => {
			return document.getElementById(id).checked
		}
		var area = [960, 720]
		if (checkRadio("custom-game-4:3"))
			area = [960, 720]
		if (checkRadio("custom-game-16:9"))
			area = [1280, 720]
		if (checkRadio("custom-game-18:9"))
			area = [1440, 720]
		var ballsize = 10
		if (checkRadio("custom-ballsize-small"))
			ballsize = 10
		if (checkRadio("custom-ballsize-medium"))
			ballsize = 20
		if (checkRadio("custom-ballsize-large"))
			ballsize = 30
		var padsize = 50
		if (checkRadio("custom-pad-size.small"))
			padsize = 50
		if (checkRadio("custom-pad-size.medium"))
			padsize = 100
		if (checkRadio("custom-pad-size.large"))
			padsize = 150
		var ballspeed = 500
		if (checkRadio("game-customization-ballspeed-s"))
			ballspeed = 200
		if (checkRadio("game-customization-ballspeed-d"))
			ballspeed = 500
		if (checkRadio("game-customization-ballspeed-f"))
			ballspeed = 700
		var ballaccel = 20
		if (checkRadio("game-customization-ballaccel-d"))
			ballaccel = 20
		if (checkRadio("game-customization-ballaccel-s"))
			ballaccel = 10
		if (checkRadio("game-customization-ballaccel-f"))
			ballaccel = 35
		if (checkRadio("game-customization-ballaccel-c"))
			ballaccel = 50
		var timemax = 180
		if (checkRadio("game-customization-timemax-3"))
			timemax = 180
		if (checkRadio("game-customization-timemax-5"))
			timemax = 300
		if (checkRadio("game-customization-timemax-8"))
			timemax = 480
		var scoremax = 5	
		if (checkRadio("game-customization-scoremax-5"))
			scoremax = 5
		if (checkRadio("game-customization-scoremax-10"))
			scoremax = 10
		if (checkRadio("game-customization-scoremax-15"))
			scoremax = 15
		if (checkRadio("game-customization-scoremax-20"))
			scoremax = 20	
		easy_req(
			(customGameNextStep == "game") ?
				"/game/create" : "/tournament/create", {
			width: area[0],
			height: area[1],
			ball_size: [ballsize, ballsize],
			ball_coef_acc: ballaccel,
			player1_size: [5, padsize],
			player2_size: [5, padsize],
			time_max: timemax,
			score_to_win: scoremax,
			ball_velocity: ballspeed
		}, null,
			(data, _) => {
				if (data.success == true) {
					if (customGameNextStep == "game") {
						setGaming({ "type": "custom_game", "uuid": data.data.party_uuid });
						window.$("#game-customization-modal").modal("hide")
						window.start_game(data.data.party_uuid, token, true)
					} else {
						window.$("#game-customization-modal").modal("hide")
						Navigate("/tournament/" + data.data.tournament)
					}
				}
			}, null,
			null);
	}

	return <Modal title={t((customGameNextStep == "game") ?
		"modal.game.customization.title" : "modal.tournament.customization.title")} id="game-customization-modal">
		<div className="modal-body">
			<p style={{ marginBottom: "0em", marginTop: "1em" }} >{t("modal.game.customization.play-area")}:</p>
			<div class="btn-group" role="group" aria-label="Basic radio toggle button group">
				<RadioTag id="custom-game-4:3" name="terrain-size">4:3</RadioTag>
				<RadioTag id="custom-game-16:9" name="terrain-size" defaultChecked>16:9</RadioTag>
				<RadioTag id="custom-game-18:9" name="terrain-size">18:9</RadioTag>
			</div>
			<p style={{ marginBottom: "0em", marginTop: "1em" }} >{t("modal.game.customization.ball-size-select")}:</p>
			<div class="btn-group" role="group" aria-label="Basic radio toggle button group">
				<RadioTag id="custom-ballsize-small" name="custom-ballsize">{t("modal.customization.ball-size-s")}</RadioTag>
				<RadioTag id="custom-ballsize-medium" name="custom-ballsize" defaultChecked>{t("modal.customization.ball-size-m")}</RadioTag>
				<RadioTag id="custom-ballsize-large" name="custom-ballsize">{t("modal.customization.ball-size-l")}</RadioTag>
			</div>
			<p style={{ marginBottom: "0em", marginTop: "1em" }} >{t("modal.game.customization.players-padsize")}:</p>
			<div class="btn-group" role="group" aria-label="Basic radio toggle button group">
				<RadioTag id="custom-pad-size.small" name="custom-pad">{t("modal.customization.pad-size-s")}</RadioTag>
				<RadioTag id="custom-pad-size.medium" name="custom-pad" defaultChecked>{t("modal.customization.pad-size-m")}</RadioTag>
				<RadioTag id="custom-pad-size.large" name="custom-pad">{t("modal.customization.pad-size-l")}</RadioTag>
			</div>
			<p style={{ marginBottom: "0em", marginTop: "1em" }}>{t("modal.game.customization.ballspeed")}:</p>
			<div class="btn-group" role="group" aria-label="Basic radio toggle button group">
				<RadioTag id="game-customization-ballspeed-s" name="custom-ballspeed">{t("modal.customization.ball-speed-s")}</RadioTag>
				<RadioTag id="game-customization-ballspeed-d" name="custom-ballspeed" defaultChecked>{t("modal.customization.ball-speed-d")}</RadioTag>
				<RadioTag id="game-customization-ballspeed-f" name="custom-ballspeed">{t("modal.customization.ball-speed-f")}</RadioTag>
			</div>
			<p style={{ marginBottom: "0em", marginTop: "1em" }}>{t("modal.game.customization.ballaccel")}:</p>
			<div class="btn-group" role="group" aria-label="Basic radio toggle button group">
				<RadioTag id="game-customization-ballaccel-d" name="custom-ballaccel" defaultChecked>{t("modal.customization.ball-accel-d")}</RadioTag>
				<RadioTag id="game-customization-ballaccel-s" name="custom-ballaccel">{t("modal.customization.ball-accel-s")}</RadioTag>
				<RadioTag id="game-customization-ballaccel-f" name="custom-ballaccel">{t("modal.customization.ball-accel-f")}</RadioTag>
				<RadioTag id="game-customization-ballaccel-c" name="custom-ballaccel">{t("modal.customization.ball-accel-c")}</RadioTag>
			</div>
			<p style={{ marginBottom: "0em", marginTop: "1em" }}>{t("modal.game.customization.timemax")}:</p>
			<div class="btn-group" role="group" aria-label="Basic radio toggle button group">
				<RadioTag id="game-customization-timemax-3" name="custom-timemax">{t("modal.customization.timemax-3")}</RadioTag>
				<RadioTag id="game-customization-timemax-5" name="custom-timemax" defaultChecked>{t("modal.customization.timemax-5")}</RadioTag>
				<RadioTag id="game-customization-timemax-8" name="custom-timemax">{t("modal.customization.timemax-8")}</RadioTag>
			</div>
			<p style={{ marginBottom: "0em", marginTop: "1em" }}>{t("modal.game.customization.scoremax")}:</p>
			<div class="btn-group" role="group" aria-label="Basic radio toggle button group">
				<RadioTag id="game-customization-scoremax-5" name="custom-score" defaultChecked>{t("modal.customization.scoremax-5")}</RadioTag>
				<RadioTag id="game-customization-scoremax-10" name="custom-score">{t("modal.customization.scoremax-10")}</RadioTag>
				<RadioTag id="game-customization-scoremax-15" name="custom-score">{t("modal.customization.scoremax-15")}</RadioTag>
				<RadioTag id="game-customization-scoremax-20" name="custom-score">{t("modal.customization.scoremax-20")}</RadioTag>
			</div>
		</div>
		<div className=" d-flex justify-content-center"><button className="btn btn-outline-success" style={{ marginLeft: "1em", marginTop: "1em" }} onClick={() => { startCustomGame() }}>
			{t((customGameNextStep == "game") ? "modal.game.button.startgame" : "modal.tournament.button.starttournament")}</button></div>
	</Modal>
}

export default GameCustomizationModal
