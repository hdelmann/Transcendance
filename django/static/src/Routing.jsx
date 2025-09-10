import {RouterProvider, Link, createBrowserRouter, NavLink, Outlet, useNavigate} from "react-router-dom"

import Root from "./Root"
import Home from "./Home"
import ProfilePage from "./ProfilePage"
import TournamentPage from "./TournamentPage"
import { useTranslation } from "react-i18next"
import { useEffect } from "react"

const router = createBrowserRouter([
    {
	path: '/',
	element:  <Root><Outlet/></Root>,
	children: [{
	    path: '',
	    element: <Home/>
	},{
	    path: 'profile/:username',
	    element: <ProfilePage/>
	},{
	    path: 'tournament/:id',
	    element: <TournamentPage/>
	},{
		path: 'oauth_error',
		element: <OAuthError/>
	}]
    }
])

var has_oauth_been_reached=false
function OAuthError({}) {
	const navigate = useNavigate()
	const {t} = useTranslation()
	useEffect(() => {
		/*	puisqu'on peut arriver ici qu'après l'OAuth,
			c'est forcément la première page chargée.

			le seul moyen de tomber ici en dehors de ce cas,
			c'est en revenant en arrière avec les flèches,
			cette condition sert juste à pas afficher
			la notif deux fois dans ce cas là	*/
		if (has_oauth_been_reached == false) {
			window.display_notif("error", t("oauth.page.failed.notif"), 15)
			has_oauth_been_reached = true
		}
		navigate("/")
	})
}

function App() {
    return <RouterProvider router={router}/>
}

export default App
