from game.Game import Game, games
from common.event_thread import event_loop
import asyncio
import time
import json
import uuid
import sys
from asgiref.sync import sync_to_async
from .models import Tournaments
from game.views import TOURNAMENT_TYPE
from notifs.utils import send_notification_async
import random
from common.getters import user2avatar_path

WAITING_PLAYERS  = 0
WAIT_STATUS      = 1
JOIN_STATUS      = 2
CANCELLED_STATUS = 3 
FINISHED_STATUS  = 4
PLAYING_STATUS   = 5
CONN_INIT_STATUS = 6

USER      = 0
STATUS    = 1
DATA      = 2
POSITIONS = 3

MAX_PLAYERS = 8

class Tournament():
    config        = None
    players       = []
    players_count = 0
    classement    = []
    uuid          = ''
    db_tournament = None
    create_tournament_in_database_async = None
    update_tournament_in_database_async = None
    rank          = 0
    games_ids     = []
    public        = 0
    
    def __init__(self, config, uuid, public):
        self.config = config
        self.config["public"]       = 0
        self.config["auto_destroy"] = 0
        self.config["need_winner"]  = 1
        self.config["game_type"]    = TOURNAMENT_TYPE
        self.uuid                   = uuid
        self.players                = []
        self.players_count          = 0
        self.games_ids              = []
        self.classement             = []
        self.create_tournament_in_database_async = sync_to_async(self.create_tournament_in_database, thread_sensitive=False)
        self.update_tournament_in_database_async = sync_to_async(self.update_tournament_in_database, thread_sensitive=False)
        self.public                 = public
        
        
    async def player_join(self, player):
        for i in range(len(self.players)):
            if self.players[i][0].user.id == player.user.id:
                if not self.players[i][0].is_conn_closed:
                    return False, True
                self.players[i][0] = player
                await player.send(json.dumps({"status": CONN_INIT_STATUS}))
                await self.send_player(player)
                return True, True
        if self.players_count >= MAX_PLAYERS:
            return False, False
        self.players.append([player, WAITING_PLAYERS, None, [self.players_count]])
        self.players_count += 1
        await player.send(json.dumps({"status": CONN_INIT_STATUS}))
        await self.send_players()
        if self.players_count >= MAX_PLAYERS:
            self.rank = MAX_PLAYERS
            asyncio.create_task(self.launch_tournament())
            #asyncio.run_coroutine_threadsafe(self.launch_tournament(), event_loop)
        return True, False

    async def launch_tournament(self):
        try:
            await self.create_tournament_in_database_async()
            turn = 1
            
            while 1:
                remaining_players = self.get_remaining_players()
                if len(remaining_players) < 2:
                    # dernier looser = winner
                    self.set_looser(remaining_players[0])
                    await self.send_players()
                    break
                # NE DEVRAIT JAMAIS ARRIVER
                assert(len(remaining_players) % 2 == 0)
                
                games_tmp = await self.create_games(remaining_players)
                await self.wait_games(games_tmp, remaining_players, turn)

                for i in range(len(games_tmp)):
                    self.games_ids.append(games[games_tmp[i]].get_id())
                    self.db_tournament.matches = self.games_ids
                    games[games_tmp[i]].destroy_game()
                turn += 1

            await self.update_tournament_in_database_async()

        except Exception as e:
            for i in range(len(self.players)):
                self.set_status(self.players[i][0], CANCELLED_STATUS)
                self.set_data(self.players[i][0], str(e))
            await self.send_players()
        # detruire le tournois apres 5 minutes
        await asyncio.sleep(300)
        destroy_tournament(self.uuid)
        return

    async def player_disconnected(self, player):
        if self.players_count < MAX_PLAYERS:
            idx = -1
            for i in range(len(self.players)):
                if self.players[i][0].user.id == player.user.id:
                    await self.players[i][0].close()
                    idx = i
                    break

            if idx != -1:
                del self.players[idx]
                self.players_count = len(self.players)
                for i in range(len(self.players)):
                    self.players[i][POSITIONS] = [i]

            await self.send_players()
        else:
            await player.close()

    def create_tournament_in_database(self):
        self.db_tournament = Tournaments.objects.create()
        tmp = []
        for i in range(len(self.players)):
            tmp.append(self.players[i][0].user.id)
        self.db_tournament.players = tmp
        self.db_tournament.save()

    def update_tournament_in_database(self):
        self.db_tournament.ranks = self.classement.copy()
        self.db_tournament.save()
        
    async def create_games(self, remaining_players):
        games_tmp = []
        for i in range(int(len(remaining_players) / 2)):
            tmp = str(uuid.uuid4())
            games_tmp.append(tmp)
            games[tmp] = Game({**self.config}, tmp)
            self.set_status(remaining_players[i*2],   JOIN_STATUS)
            self.set_status(remaining_players[i*2+1], JOIN_STATUS)
            self.set_data(remaining_players[i*2],     tmp)
            self.set_data(remaining_players[i*2+1],   tmp)
        await self.send_players()
        return games_tmp

    async def wait_games(self, games_tmp, remaining_players, turn):
        timer       = int(time.time())
        old_delta   = 0
        ended       = []
        started     = []
        
        while 1:
            done = 1
            for i in range(len(games_tmp)):
                if i in ended:
                    continue
                if turn == 1:
                    if i == 0:
                        pos = 8
                    elif i == 1:
                        pos = 9
                    elif i == 2:
                        pos = 10
                    elif i == 3:
                        pos = 11
                if turn == 2:
                    if i == 0:
                        pos = 12
                    elif i == 1:
                        pos = 13
                if turn == 3:
                    pos = 14
                if games[games_tmp[i]].get_ended_at() != None:
                    looser = games[games_tmp[i]].get_looser()
                    if looser.id == remaining_players[i*2].user.id:
                        self.set_looser(remaining_players[i*2])
                        self.set_winner(remaining_players[i*2+1], pos)
                    else:
                        self.set_looser(remaining_players[i*2+1])
                        self.set_winner(remaining_players[i*2], pos)
                    await self.send_players()
                    ended.append(i)
                    continue
                elif games[games_tmp[i]].get_started_at() != None:
                    if i not in started:
                        self.set_status(remaining_players[i*2],   PLAYING_STATUS)
                        self.set_status(remaining_players[i*2+1], PLAYING_STATUS)
                        self.set_data(remaining_players[i*2],     "playing")
                        self.set_data(remaining_players[i*2+1],   "playing")
                        started.append(i)
                        await self.send_players()
                else:
                    if int(time.time()) - timer > 20:
                        # forcement 1 seul joueur max si game pas commencer
                        await games[games_tmp[i]].block_game()
                        tmp = games[games_tmp[i]].get_players()
                        if len(tmp) == 0:
                            if random.randint(0, 1):
                                self.set_looser(remaining_players[i*2+1])
                                self.set_winner(remaining_players[i*2], pos)
                            else:
                                self.set_looser(remaining_players[i*2])
                                self.set_winner(remaining_players[i*2+1], pos)
                        else:
                            if tmp[0].id == remaining_players[i*2].user.id:
                                self.set_looser(remaining_players[i*2+1])
                                self.set_winner(remaining_players[i*2], pos)
                            else:
                                self.set_looser(remaining_players[i*2])
                                self.set_winner(remaining_players[i*2+1], pos)
                        await self.send_players()
                        ended.append(i)
                        continue
                    else:
                        tmp = games[games_tmp[i]].get_players()
                        if len(tmp) != 0:
                            if tmp[0].id == remaining_players[i*2].user.id:
                                if remaining_players[i*2+1].is_conn_closed:
                                    await send_notification_async(
                                        remaining_players[i*2+1].user.id,
                                        "TOURNAMENT_MATCH_ALERT", {"uuid": self.uuid, "timeout": 20 - (int(time.time()) - timer)})
                            else:
                                if remaining_players[i*2].is_conn_closed:
                                    await send_notification_async(
                                        remaining_players[i*2].user.id,
                                        "TOURNAMENT_MATCH_ALERT", {"uuid": self.uuid, "timeout": 20 - (int(time.time()) - timer)})
                done = 0
            if done == 1:
                break
            await asyncio.sleep(1)
    
    def get_remaining_players(self):
        remaining_players = []
        for i in range(len(self.players)):
            if self.players[i][STATUS] != FINISHED_STATUS:
                remaining_players.append(self.players[i][USER])
        return remaining_players
                
    async def send_players(self):
        infos = self.get_tournament_data()
        for i in range(len(self.players)):
            await self.players[i][0].send(json.dumps({"status": self.players[i][STATUS], "data": self.players[i][DATA], "infos": infos}))

    async def send_player(self, player):
        infos = self.get_tournament_data()
        for i in range(len(self.players)):
            if self.players[i][0] is player:
                await self.players[i][0].send(json.dumps({"status": self.players[i][STATUS], "data": self.players[i][DATA], "infos": infos}))
                break

    def set_data(self, player, data):
        if player == None:
            return
        for i in range(len(self.players)):
            if player.user.id == self.players[i][USER].user.id:
                self.players[i][DATA] = data
        
    def set_status(self, player, status):
        if player == None:
            return
        for i in range(len(self.players)):
            if player.user.id == self.players[i][USER].user.id:
                self.players[i][STATUS] = status

    def set_pos(self, player, pos):
        if player == None:
            return
        for i in range(len(self.players)):
            if player.user.id == self.players[i][USER].user.id:
                self.players[i][POSITIONS].append(pos)
                
    def set_looser(self, player):
        self.classement.append(player.user.id)
        self.set_status(player, FINISHED_STATUS)
        self.set_data(player, self.rank)
        self.rank -= 1

    def set_winner(self, player, pos):
        self.set_pos(player, pos)
        self.set_status(player, WAIT_STATUS)
        self.set_data(player, "wait")

    def set_players_status(self, status):
        for i in range(len(self.players)):
            self.set_status(self.players[i][0], status)

    def set_players_data(self, data):
        for i in range(len(self.players)):
            self.set_data(self.players[i][0], data)
            
    def is_full(self):
        return self.players_count >= MAX_PLAYERS
        
    def get_tournament_data(self):
        tmp = []
        for i in range(len(self.players)):
            tmp.append([self.players[i][0].user.id, self.players[i][0].user.username, self.players[i][POSITIONS], user2avatar_path(self.players[i][0].user)])
        data = {
            "players_count": self.players_count,
            "classement": self.classement,
            "players": tmp,
        }
        return data
    
    def is_user_present(self, user):
        if user == None:
            return False
        for i in range(len(self.players)):
            if self.players[i][0].user.id == user.user.id:
                return True
        return False

    def is_public_tournament_available(self):
        return self.players_count < MAX_PLAYERS and self.public == 1
    
    def get_status(self, player):
        if player == None:
            return
        for i in range(len(self.players)):
            if self.players[i][0].user.id == player.user.id:
                return {"status": self.players[i][STATUS], "data": self.players[i][DATA], "infos": self.get_tournament_data()}

        return None

def destroy_tournament(uuid):
    global tournaments
    del tournaments[uuid]


tournaments = {}
