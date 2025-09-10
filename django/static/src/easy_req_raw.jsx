import Cookies from 'universal-cookie';

const EASY_LIB_URL_BASE="https://"+document.location.host+"/api/"

function easy_req_raw(endpoint, post_data, func_data, success_callback, error_callback, setUserdata) {
    const cookies = new Cookies()
    const headers = cookies.get('client_token') ? 
    {"Authorization" : "Bearer " + cookies.get('client_token')}:
    {}

    fetch(EASY_LIB_URL_BASE+endpoint, {
        method: "POST",
        headers: headers,
        body: post_data ? post_data : null
    })
    .then((response) => response.json())
    .then((data) => {
        if(
            data.success == false && (
                data.error_code == "MISSING_TOKEN" ||
                data.error_code == "INVALID_TOKEN" ||
                data.error_code == "EXPIRED_TOKEN")){
            cookies.remove('client_token')
            if(setUserdata)
                setUserdata(null)
            return
        }
        success_callback(data, func_data)})
    .catch((error) => {
        if (error_callback)
            error_callback(error, func_data)
        else
            window.display_notif("error", error, 5)
    })

}

export default easy_req_raw
