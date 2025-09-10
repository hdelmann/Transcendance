import easy_req from "./easy_req";

function GetChatList(setUserData, setChatList, setIsReady) {
    easy_req("chats/", null, null, (data, _)=> {
        if (data.success == true) {
            setChatList(data.data.chats)
            if (setIsReady)
                setIsReady(true)
        }
    }, null, setUserData)
}

export default GetChatList