import React, { useState, useEffect, Fragment } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import easy_req from "./easy_req";
import { useTranslation } from 'react-i18next';

function time2human(time) {
    let minutes = Math.floor(time / 60);
    let seconds = time % 60;

    minutes = minutes.toString().padStart(2, '0');
    seconds = seconds.toString().padStart(2, '0');

    return minutes + ":" + seconds;
}

function ProfilePage() {
    let { username } = useParams();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    if (userdata == null) {
		useEffect(() => {
			window.display_notif("info", t("profile.error.notlogged"), 15)
			navigate("/")})
		return
		}
		

    const getStatusStr = (status, player1, player2) => {
	switch (status) {
	case 0:
	    return t("profile.match.status.not.started");
	case 1:
	    return t("profile.match.status.player.won", {username: player1});
	case 2:
	    return t("profile.match.status.player.won", {username: player2});
	case 3:
	    return t("profile.match.status.draw");
	default:
	    return t("profile.match.status.unknown");
	}
    };

    const getTypeStr = (type) => {
	switch (type) {
	case 1:
	    return t("profile.match.type.custom");
	case 2:
	    return t("profile.match.type.matchmaking");
	case 3:
	    return t("profile.match.type.tournament");
	default:
	    return t("profile.match.type.unknown");
	}
    }

    useEffect(() => {
	async function fetchUser() {
	    easy_req("/user/" + username + '?fields=match_history', null, null,
		     (data, _) => {
			 if (data.success == true) {
			     setUserData(data.data)
			     setLoading(false)
			 } else {
			     navigate("/")
			     window.display_notif("error", data.message, 10)
			 }
		     },
		     (error, _) => {
			 navigate("/")
			 window.display_notif("error", error, 5)
		     },
		     null);
	}
	fetchUser();
    }, [username]);
    return (
	<div>
	    {loading ? (
		<p>{t("loading.status")}</p>
	    ) : (
		<div>
		    {userData ? (
			<div>
			    <h1 style={{textAlign: "center", marginBottom: "1em"}}>
				<img style={{display: "inline-block", height: "1em", width: "1em", marginRight: "0.5em"}} className='rounded-circle' src={userData.avatar}></img>{userData.username}</h1>
			    {userData.match_history ? <div className="d-flex justify-content-around">
							  <p style={{textAlign: "center"}}>
								<span style={{fontSize: "5em"}}>{userData.stats[0]}</span>
								<br/>{t("profile.match.stats.wins")}</p>
								<p style={{textAlign: "center"}}>
								<span style={{fontSize: "5em"}}>{userData.stats[1]}</span>
								<br/>{t("profile.match.stats.draws")}</p>
								<p style={{textAlign: "center"}}>
								<span style={{fontSize: "5em"}}>{userData.stats[2]}</span>
								<br/>{t("profile.match.stats.losses")}</p>
						      </div> : null
			    }
			    {userData.match_history ? (
				userData.match_history.map((match) => (
				    <Fragment key={match.id}>
					<hr style={{ opacity: "1", border: "1px solid gray" }} />
					<div className='d-flex justify-content-around' style={{ marginBottom: "1.5em", width: "10" }}>
					    <img className='rounded-circle' src={match.player_1_avatar} style={{ display: "inline", height: "3em", width: "3em" }}></img>
					    <div className="col" style={{ textAlign: "left", marginTop: "0.8em", marginLeft: "1em" }}>
						<Link style={{ textDecoration: "none", color: "white" }} to={"/profile/" + match.player_1_username}>{match.player_1_username}</Link>
					    </div>
					    <div style={{ display: "inline-block", width: "30em", height: "0em", marginTop: "0.5em" }} className="container">
						<div className="row" style={{ height: "1em" }}>
						    <div className="col" style={{ textAlign: "left" }}>
							<p>{match.player_1_score} {t("profile.match-history.points")}</p>
						    </div>
						    <div className="col" style={{ textAlign: "center" }}>
							<p>{getTypeStr(match.game_type)}</p>
						    </div>
						    <div className="col" style={{ textAlign: "right" }}>
							<p>{match.player_2_score} {t("profile.match-history.points")}</p>
						    </div>
						</div>
						{match.status ?
						 <div className="row" style={{ height: "1em" }}>
						     <div className="col" style={{ textAlign: "left" }}>
							 <p>{time2human(match.duration)}</p>
						     </div>
						     <div className="col" style={{ textAlign: "center" }}>
							 <p>{getStatusStr(match.status, match.player_1_username, match.player_2_username)}</p>
						     </div>
						     <div className="col" style={{ textAlign: "right" }}>
							 <p title={match.created_at.slice(0, 19)}>{match.created_at.slice(0, 10)}</p>
						     </div>
						 </div>
						 :
						 <div className="row" style={{ height: "1em" }}>
						     <div className="col" style={{ textAlign: "center" }}>
							 <p>{getStatusStr(match.status, "", "")}</p>
						     </div>
						 </div>}
					    </div>
					    <div className="col" style={{ textAlign: "right", marginTop: "0.8em", marginRight: "1em" }}>
						<Link style={{ textDecoration: "none", color: "white" }} to={"/profile/" + match.player_2_username}>{match.player_2_username}</Link>
					    </div>
					    <img className='rounded-circle' src={match.player_2_avatar} style={{ display: "inline", height: "3em", width: "3em" }}></img>
					</div>
					<hr style={{ opacity: "1", border: "1px solid gray" }} />
				    </Fragment>
				))
			    ) : (
				<p>{t("profile.match-history.nohistory")}</p>
			    )}
			</div>
		    ) : (
			<h1>{t("profile.match-history.noprofile")}</h1>
		    )}
		</div>
	    )}
	</div>
    );
}

export default ProfilePage;
