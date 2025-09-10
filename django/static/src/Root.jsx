import { useEffect, useState } from "react"
import Menu from "./Menu"
import FriendsModal from "./FriendsModal"
import LoginModal from "./LoginModal"
import RegisterModal from "./RegisterModal"
import SettingsModal from "./SettingsModal"
import { UserDataContext } from './UserDataContext'
import { FriendshipContext } from "./FriendshipContext"
import { GamingContext } from "./GamingContext"
import InitNotifs from "./Notifs";
import ChatComponent from "./ChatComponent"
import NewChatModal from "./NewChatModal"
import { ChatContext } from "./ChatContext"
import { useTranslation } from "react-i18next"
import Cookies from "universal-cookie"
import GameCustomizationModal from "./GameCustomizationModal"
import initlogin from "./initLogin"
import { CustomGameContext } from "./CustomGameContext"

function Root({ children }) {
    const [userdata, setUserdata] = useState(null);
    const [friendships, setFriendships] = useState({"friends": [],
						    "sent": [],
						    "received": [],
						    "blocked": []});
    const [gaming, setGaming] = useState(null);
    const [chatid, setChatid] = useState(0);
    const [chatlist, setChatlist] = useState([])
    const [messages, setMessages] = useState([])
    const { t, i18n: { changeLanguage, language } } = useTranslation();
    const cookies = new Cookies();
    const lang = cookies.get("lang");
	const [isUserReady, setIsUserReady] = useState(false)
	const [customGameNextStep, setCustomGameNextStep] = useState("game")
    
    window.userdata			= userdata // ramcho code -> monkey patch 
    window.T				= t
	window.user_language	= language 
	window.setGaming		= setGaming 

	if (lang == null) {
		cookies.set("lang", language, {maxAge: 60*60*24*31*6, path: "/"});
	}
    if (lang != language) {
        changeLanguage(lang)
    }

	useEffect(() => {
		if (isUserReady == false) {
			var token = cookies.get("client_token")
			if (token != null)
				initlogin(setUserdata, setIsUserReady)
			else
				setIsUserReady(true)
		}
	}, [isUserReady])
    
    // close any modal when the user log out
    useEffect(() => {
		if (userdata == null) {
			window.$('.modal').modal('hide');
			}
		},
		[userdata]
	)
    
    return (
	<>
	    <UserDataContext.Provider value={{ userdata, setUserdata }}>
		<FriendshipContext.Provider value={{friendships, setFriendships}}>
		    <GamingContext.Provider value={{gaming, setGaming}}>
			    <ChatContext.Provider value={{chatid, setChatid, chatlist, setChatlist, messages, setMessages}}>
				<CustomGameContext.Provider value={{customGameNextStep, setCustomGameNextStep}}>
				<ChatComponent/>
				<InitNotifs/>
				<Menu userdata={userdata} />
				<SettingsModal/>
				<RegisterModal/>
				<LoginModal/>
				<FriendsModal/>
				<NewChatModal/>
				<GameCustomizationModal/>
				{isUserReady && <div className="container">{children}</div>}
				</CustomGameContext.Provider>
			    </ChatContext.Provider>
		    </GamingContext.Provider>
		</FriendshipContext.Provider>
	    </UserDataContext.Provider>
	</>
    );
}

export default Root
