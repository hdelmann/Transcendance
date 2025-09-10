import easy_req from './easy_req';

function GetFriends(setUserdata, setFriendships, open_modal) {
    easy_req("/friends/", null, null, (data, _) => {
      if(data.success  == true)
      {
        setFriendships(data.data)
        if(open_modal)
          window.$("#friends-modal").modal('show')
      }
    }, null, setUserdata)
  }

export default GetFriends
