from channels.generic.websocket import AsyncWebsocketConsumer
from auths.utils import verify_usertoken_async
from .Notifs import notifs, Notifs
from .utils import send_notification_to_friends_async
import random

class NotifsConsumer(AsyncWebsocketConsumer):

    user = None
    conn_id = 0
    
    async def connect(self):
        await self.accept()
        token = str(self.scope['path_remaining'])
        self.user       = await verify_usertoken_async(token)
        self.conn_id    = random.random()

        if self.user == None:
            await self.send("Invalid token")
            await self.close()
            return
        tmp = notifs.get(self.user.id, {}.copy())
        tmp[self.conn_id] = Notifs(self)
        notifs[self.user.id] = tmp
        if len(tmp) == 1:
            await send_notification_to_friends_async(
                self.user.id,
                "USER_WENT_ONLINE",
                {"id": self.user.id})

    async def receive(self, text_data):
        # rien a faire je pense
        pass

    async def disconnect(self, close_code):
        if self.user and self.conn_id:
            del notifs[self.user.id][self.conn_id]
            if len(notifs[self.user.id]) == 0:
                del notifs[self.user.id]
                await send_notification_to_friends_async(
                    self.user.id,
                    "USER_WENT_OFFLINE",
                    {"id": self.user.id})

