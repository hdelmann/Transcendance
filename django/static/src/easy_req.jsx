import Cookies from 'universal-cookie';
import i18next from "i18next";

const EASY_LIB_URL_BASE = "https://"+document.location.host+"/api/"

var g_setUserData = null

function easy_req(endpoint, post_data, func_data, success_callback, error_callback, setUserdata, setIsUserReady) {
    const cookies = new Cookies()
    const headers = cookies.get('client_token') ?
        { "Authorization": "Bearer " + cookies.get('client_token') } :
        {}

    var method = "GET";
    if (post_data !== null) {
        method = "POST"
    }

    if (setUserdata != null)
        g_setUserData = setUserdata

    fetch(EASY_LIB_URL_BASE + endpoint, {
        method: method,
        headers: headers,
        body: post_data ? JSON.stringify(post_data) : null
    })
        .then((response) => response.json())
        .then((data) => {
            if (
                data.success == false && (
                    data.error_code == "MISSING_TOKEN" ||
                    data.error_code == "INVALID_TOKEN" ||
                    data.error_code == "EXPIRED_TOKEN")) {
                cookies.remove('client_token')
                window.display_notif("info", i18next.t("session.expired.notif"), 15)
                if (setUserdata)
                    setUserdata(null)
                else if (g_setUserData)
                    g_setUserData(null)
                if (setIsUserReady)
                    setIsUserReady(true)
                return
            }
            success_callback(data, func_data)
        })
        .catch((error) => {
            if (error_callback)
                error_callback(error, func_data)
            else
                window.display_notif("error", error, 5)
        })
}

export default easy_req

