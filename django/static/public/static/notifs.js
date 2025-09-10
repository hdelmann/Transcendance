function undisplay_notif(id) {
    if (id === null)
        return
    const elem = document.getElementById("notification-"+id)
    if (elem != null)
        elem.remove()
}

function display_notif(icon_name, text, timeout, cancel_callback, accept_callback, custom_id) {
    const notification_id = custom_id ? custom_id : makeid(10)

    undisplay_notif(notification_id)

    const container = document.createElement("div");
    container.className = "notification-container"
    container.id        = "notification-"+notification_id

    const icon      = document.createElement("img")
    icon.src        = "/static/"+icon_name+"-icon.svg"
    icon.className  = "notification-icon"
    container.appendChild(icon)

    const message       = document.createElement("p")
    message.className   = "notification-text"
    message.appendChild(document.createTextNode(text))
    container.appendChild(message)

    if (accept_callback) {
        const accept      = document.createElement("img")
        accept.src        = "/static/play.svg"
        accept.className  = cancel_callback ? "notification-accept-with-cancel" : "notification-accept-alone"
        accept.addEventListener("click", () => {
            undisplay_notif(container)
            accept_callback()
        }, false);
        container.appendChild(accept)
    }

    if (cancel_callback) {
        const cancel      = document.createElement("img")
        cancel.src        = "/static/cancel.svg"
        cancel.className  = "notification-cancel"
        cancel.addEventListener("click", () => {
            undisplay_notif(container)
            cancel_callback()
        }, false);
        container.appendChild(cancel)
    }

    document.getElementById("notifications-container").prepend(container)

    if (timeout != 0) {
        setTimeout(() => {
            undisplay_notif(notification_id)
        }, timeout * 1000);
    }

    return notification_id
}