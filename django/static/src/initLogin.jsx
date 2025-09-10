import easy_req from "./easy_req";

function initlogin(setUserdata, setIsUserReady) {
    easy_req("/user/@me?fields=email", null, null, (data, _) => {
        if(data.success == false)
        {
                window.display_notif("error", data.message, 15)
                setUserdata(null);
        }
        else{
                setUserdata(data.data)
        }
        if (setIsUserReady != null)
            setIsUserReady(true)
    }, null, 
	     setUserdata, setIsUserReady)  
}

export default initlogin