from channels.generic.websocket import AsyncWebsocketConsumer
from auths.utils import verify_usertoken_async
from json import dumps
from .Game import games
from common.getters import translate

class GameConsumer(AsyncWebsocketConsumer):

    game_uuid = None
    user      = None
    T         = None
    
    async def connect(self):
        await self.accept()

        path = str(self.scope['path_remaining'])
        tmp = path.split('/')
        if len(tmp) != 3:
            await self.send(dumps({"id": -1, "error_code": "BED_ENDPOINT", "error": "bed endpoint!"})) # there is no translation since we cant know it
            await self.close()
            return
        
        uuid_party  = tmp[0]
        uuid_player = tmp[1]
        self.T      = lambda str_key, **kwargs: translate(tmp[2], str_key, **kwargs)

        if uuid_party not in games or not games[uuid_party]:
            await self.send(dumps({"id": -1, "error_code": "GAME_NOT_FOUND", "error": self.T("error.game.not.found")}))
            await self.close()
            return
        self.user = await verify_usertoken_async(uuid_player)
        if self.user == None:
            await self.send(dumps({"id": -1, "error_code": "BAD_TOKEN", "error": self.T("error.game.bad.token")}))
            await self.close()
            return

        joined, already_joined = await games[uuid_party].player_join(self)

        if joined == False:
            if already_joined == False:
                await self.send(dumps({"id": -1, "error_code": "GAME_FULL", "error": self.T("error.game.full")}))
            else:
                await self.send(dumps({"id": -1, "error_code": "GAME_ALREADY_JOINED", "error": self.T("error.game.already.joined")}))
            await self.close()
            return
        self.game_uuid = uuid_party
        return
                      
    async def receive(self, text_data):
        if self.game_uuid != None and self.game_uuid in games:
            await games[self.game_uuid].recv_player(text_data, self)
        pass

    async def disconnect(self, close_code):
        print("player disconnected")
        if self.game_uuid != None and self.game_uuid in games:
            await games[self.game_uuid].player_disconnected(self)
        
