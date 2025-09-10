import json

class Notifs():

    user_ws = 0
    def __init__(self, user_ws):
        self.user_ws = user_ws
        pass

    async def send_notification(self, data):
        await self.user_ws.send(json.dumps(data))

notifs = {}
