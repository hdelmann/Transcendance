from channels.generic.websocket import AsyncWebsocketConsumer
from auths.utils import verify_usertoken_async
from json import dumps
from .Tournaments import tournaments
from common.getters import translate

class TournamentConsumer(AsyncWebsocketConsumer):

    tournament_uuid = None
    user      = None
    T         = None
    is_conn_closed = False

    async def connect(self):
        await self.accept()

        path = str(self.scope['path_remaining'])
        tmp = path.split('/')
        if len(tmp) != 3:
            await self.send(dumps({"status": -1, "error_code": "BED_ENDPOINT", "error": "bed endpoint!"})) # there is no translation since we cant know it
            await self.close()
            return
        
        uuid_party  = tmp[0]
        uuid_player = tmp[1]
        self.T      = lambda str_key, **kwargs: translate(tmp[2], str_key)

        if uuid_party not in tournaments or not tournaments[uuid_party]:
            await self.send(dumps({"status": -1, "error_code": "TOURNAMENT_NOT_FOUND", "error": self.T("error.tournament.not.found")}))
            await self.close()
            return
        self.user = await verify_usertoken_async(uuid_player)
        if self.user == None:
            await self.send(dumps({"status": -1, "error_code": "BAD_TOKEN", "error": self.T("error.tournament.bad.token")}))
            await self.close()
            return

        joined, is_already_in = await tournaments[uuid_party].player_join(self)

        if joined == False:
            if is_already_in == False:
                await self.send(dumps({"status": -1, "error_code": "TOURNAMENT_FULL", "error": self.T("error.tournament.full")}))
            else:
                await self.send(dumps({"status": -1, "error_code": "TOURNAMENT_ALREADY_JOINED", "error": self.T("error.tournament.already.joined")}))
            await self.close()
            return
        self.tournament_uuid = uuid_party
        return

    async def disconnect(self, close_code):
        if self.tournament_uuid != None and self.tournament_uuid in tournaments:
            await tournaments[self.tournament_uuid].player_disconnected(self)
        self.is_conn_closed = True
        
