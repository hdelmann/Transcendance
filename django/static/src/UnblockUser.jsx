import easy_req from './easy_req.jsx';
import GetFriends from './GetFriends.jsx'

function UnblockUser(setFriendships, setUserdata, username, error_p_id) {
    var error_p = window.$("#"+error_p_id)[0]
	error_p.innerText = ""

    easy_req("/friends/unblock", {username:username}, null, (data, _) => {
        if(data.success == false)
            error_p.innerText = data.message
        else
            GetFriends(setUserdata, setFriendships, false)
    }, null, setUserdata)
    return <>
    </>
}

export default UnblockUser