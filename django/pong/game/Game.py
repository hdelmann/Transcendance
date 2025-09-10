import asyncio
import json
import math
import time
import random
from asgiref.sync import sync_to_async
from .models import Matches
from notifs.utils import send_notification_to_friends_async

PACKET_INIT_ID=0x1
PACKET_INIT_CONFIRM_ID=0x2
PACKET_PLAY_ID=0x3
PACKET_PLAYER_PLAY_ID=0x4
PACKET_FINISH_ID=0x5

X = 0
Y = 1
PI = math.pi

class Game():
    # variables pour le jeu
    player1             = None
    player1_pos         = [0, 0]
    player1_size        = [0, 0]
    player1_inited      = 0
    player_count        = 0
    player2             = None
    player2_pos         = [0, 0]
    player2_size        = [0, 0]
    player2_inited      = 0
    ball_pos            = [0, 0]
    ball_size           = [0, 0]
    ball_direction      = 0
    ball_velocity       = 0
    ball_coef_acc       = 0
    time_max            = 0
    score_to_win        = 0
    score               = [0, 0]
    width               = 0
    height              = 0
    cooldown            = 0
    public              = 1
    auto_destroy        = 1
    uuid                = ''
    winner              = None
    need_winner         = 0
    started_at          = None
    ended_at            = None
    create_game_in_database_async = None
    update_game_in_database_async = None
    db_game             = None
    config              = ''
    reason              = ''
    game_type           = 0
    is_game_blocked     = False
    
    def __init__(self, config, uuid):
        self.player1             = None
        self.player2             = None
        self.config              = str(config)
        self.width               = config['width']
        self.height              = config['height']
        self.player2_size        = config['player2_size'].copy()
        self.player1_size        = config['player1_size'].copy()
        self.ball_size           = config['ball_size'].copy()
        self.player1_pos         = [0, self.height / 2 - self.player1_size[Y] / 2]
        self.player2_pos         = [self.width - self.player2_size[X], self.height / 2  - self.player2_size[Y] / 2]
        self.ball_pos            = [self.width / 2 - self.ball_size[X] / 2, self.height / 2 - self.ball_size[Y] / 2]
        self.ball_direction      = 0
        self.ball_velocity       = config['ball_velocity']
        self.ball_coef_acc       = config['ball_coef_acc']
        self.time_max            = config['time_max']
        self.score_to_win        = config['score_to_win']
        self.score               = [0, 0]
        self.cooldown            = 0
        self.public              = config["public"]
        self.auto_destroy        = config["auto_destroy"]
        self.uuid                = uuid
        self.winner              = None
        self.need_winner         = config["need_winner"]
        self.ended_at            = None
        self.started_at          = None
        self.create_game_in_database_async = sync_to_async(self.create_game_in_database)
        self.update_game_in_database_async = sync_to_async(self.update_game_in_database)
        self.player1_inited      = 0
        self.player2_inited      = 0
        self.game_type           = config["game_type"]
        pass

    async def player_join(self, player):
        if self.player_count >= 2 or self.started_at or self.ended_at:
            return False, False

        if self.player1 and self.player1.user.id == player.user.id:
            return False, True
        elif self.player2 and self.player2.user.id == player.user.id:
            return False, True

        if self.player_count == 0:
            self.player1 = player
        else:
            self.player2 = player
        self.player_count += 1
        if self.player_count >= 2:
            asyncio.create_task(self.launch_game())
        return True, False

    def correct_intersect(self, intersect):
        if intersect <= 0.55 and intersect >= 0.45:
            return 0.5
        if intersect >= 0.95:
            return 0.95
        if intersect <= 0.05:
            return 0.05
        return intersect

    async def calculate_ball_position(self):
        current_time = time.time()
        next_ball_pos_x = self.ball_pos[X] + (self.ball_velocity * math.cos(self.ball_direction) * (current_time - self.ball_timer))
        next_ball_pos_y = self.ball_pos[Y] + (self.ball_velocity * math.sin(self.ball_direction) * (current_time - self.ball_timer))
        if next_ball_pos_y <= 0 or next_ball_pos_y >= self.height - self.ball_size[Y]:
            self.ball_direction = -self.ball_direction
            if next_ball_pos_y <  0:
                next_ball_pos_y = 0.1
            elif next_ball_pos_y > self.height-self.ball_size[Y]:
                next_ball_pos_y = self.height-self.ball_size[Y]-0.1
        if next_ball_pos_x  <= self.player1_size[X] or next_ball_pos_x + (self.ball_size[X]) >= (self.width - self.player2_size[Y]):
            # Collision with Player 1's paddle
            if next_ball_pos_x <= self.player1_size[X]:
                if next_ball_pos_x != self.ball_pos[X]:
                    m_ball_1_x = self.player1_size[X]
                    m_ball_1_y = self.ball_pos[Y] + (next_ball_pos_y - self.ball_pos[Y]) * ((0 - self.ball_pos[X])/(next_ball_pos_x - self.ball_pos[X]))
                    if (m_ball_1_y + (self.ball_size[Y]) >= self.player1_pos[Y] and m_ball_1_y + self.ball_size[Y] <= self.player1_pos[Y] + self.player1_size[Y]) or (m_ball_1_y >= self.player1_pos[Y] and m_ball_1_y <= self.player1_pos[Y] + self.player1_size[Y]) or (m_ball_1_y <= self.player1_pos[Y] and m_ball_1_y + self.ball_size[Y] >= self.player1_pos[Y] + self.player1_size[Y]):
                        next_ball_pos_x = m_ball_1_x
                        next_ball_pos_y = m_ball_1_y
                        relative_intersect = self.correct_intersect((m_ball_1_y + self.ball_size[Y] / 2 - self.player1_pos[Y]) / self.player1_size[Y])
                        angle_offset = (relative_intersect - 0.5) * PI / 3
                        self.ball_direction = angle_offset
                        self.ball_velocity += self.ball_coef_acc
                        self.ball_timer = time.time()
                        self.ball_pos[X] = next_ball_pos_x
                        self.ball_pos[Y] = next_ball_pos_y
                        return

            # Collision with Player 2's paddle
            if next_ball_pos_x + (self.ball_size[X]) >= (self.width - self.player2_size[X]):
                if next_ball_pos_x != self.ball_pos[X]:
                    m_ball_2_x = self.width - self.player2_size[X] - self.ball_size[X]
                    m_ball_2_y = self.ball_pos[Y] + (next_ball_pos_y - self.ball_pos[Y]) * ((self.width - self.ball_size[X] - self.ball_pos[X]) / (next_ball_pos_x - self.ball_pos[X]))
                    if (m_ball_2_y + (self.ball_size[Y]) >= self.player2_pos[Y] and m_ball_2_y + (self.ball_size[Y]) <= self.player2_pos[Y] + self.player2_size[Y]) or (m_ball_2_y >= self.player2_pos[Y] and m_ball_2_y <= self.player2_pos[Y] + self.player2_size[Y]) or (m_ball_2_y <= self.player2_pos[Y] and m_ball_2_y + self.ball_size[Y] >= self.player2_pos[Y] + self.player2_size[Y]):
                        next_ball_pos_x = m_ball_2_x
                        next_ball_pos_y = m_ball_2_y
                        relative_intersect = self.correct_intersect((m_ball_2_y + self.ball_size[Y] / 2 - self.player2_pos[Y]) / self.player2_size[Y])
                        angle_offset = (relative_intersect - 0.5) * PI / 3
                        self.ball_direction = -PI - angle_offset
                        self.ball_velocity += self.ball_coef_acc
                        self.ball_timer = time.time()
                        self.ball_pos[X] = next_ball_pos_x
                        self.ball_pos[Y] = next_ball_pos_y
                        return
        
            # Ball missed paddles and is out of bounds
            if next_ball_pos_x  <= 0 or next_ball_pos_x + (self.ball_size[X]) >= self.width:
                self.ball_pos[X] = self.width / 2 - self.ball_size[X] / 2
                self.ball_pos[Y] = self.height / 2 - self.ball_size[Y] / 2
                self.player1_pos[X] = 0
                self.player1_pos[Y] = self.height / 2 - self.player1_size[Y] / 2
                self.player2_pos[X] = self.width - self.player2_size[X]
                self.player2_pos[Y] = self.height / 2 - self.player2_size[Y] / 2
                self.ball_velocity = self.default_velocity
                if next_ball_pos_x <= 0:
                    self.ball_direction = PI
                    self.score[Y] += 1
                else:
                    self.ball_direction = 0
                    self.score[X] += 1
                if self.score[X] == self.score_to_win or self.score[Y] == self.score_to_win:
                    self.reason = 'score_max'
                    self.winner = self.player1.user if self.score[X] == self.score_to_win else self.player2.user
                    self.ended_at = time.time()
                    await self.send_players(self.make_finish_packet())
                    await self.disconnect_players()
                    await self.update_game_in_database_async()
                    if self.auto_destroy == 1:
                        await self.player1.close()
                        await self.player2.close()
                        destroy_game(self.uuid)
                    return
                await self.send_players(self.make_play_packet())
                self.cooldown = 3.9
                self.start_cooldown = time.time()
                return
    
        # Update ball position
        self.ball_pos[X] = next_ball_pos_x
        self.ball_pos[Y] = next_ball_pos_y
        self.ball_timer = time.time()
    
    async def launch_game(self):
        if await self.create_game_in_database_async() == False:
            await self.disconnect_players()
            destroy_game(self.uuid)
            return

        await send_notification_to_friends_async(self.player1.user.id, "USER_WENT_INGAME", {"id": self.player1.user.id})
        await send_notification_to_friends_async(self.player2.user.id, "USER_WENT_INGAME", {"id": self.player2.user.id})
        
        self.started_at = time.time()
        await self.send_players(self.make_init_packet())
    
        # Attendre le packet de confirmation d'initialisation
        while not (self.player1_inited and self.player2_inited):
            await asyncio.sleep(0.5)
    
        self.started_at = time.time()
        self.cooldown = 3.9
        self.start_cooldown = time.time()
        self.default_velocity = self.ball_velocity
        self.end_time = time.time() + self.time_max
        self.ball_timer = time.time()
    
        while True:
            if self.winner:
                break
            
            await self.send_players(self.make_play_packet())
            await asyncio.sleep(0.1)
    
            if self.cooldown > 0:
                self.cooldown -= time.time() - self.start_cooldown
                self.start_cooldown = time.time()
                self.ball_timer = time.time()
                continue
            
            current_time = time.time()
            if current_time >= self.end_time:
                self.reason = 'timeout'
                break
            
            await self.calculate_ball_position()
    
        self.ended_at = time.time()
    
        if self.winner == None:
            if self.score[X] > self.score[Y]:
                self.winner = self.player1.user
            elif self.score[X] < self.score[Y]:
                self.winner = self.player2.user
            else:
                if self.need_winner:
                    self.reason = "random_winner"
                    self.winner = self.player1.user if random.randint(0, 1) == 0 else self.player2.user
    
        await self.send_players(self.make_finish_packet())
        await self.disconnect_players()
        await send_notification_to_friends_async(self.player1.user.id, "USER_WENT_ONLINE", {"id": self.player1.user.id})
        await send_notification_to_friends_async(self.player2.user.id, "USER_WENT_ONLINE", {"id": self.player2.user.id})
        await self.update_game_in_database_async()
    
        if self.auto_destroy == 1:
            destroy_game(self.uuid)

    async def send_players(self, packet):
        await self.player1.send(packet)
        await self.player2.send(packet)

    async def recv_player(self, data, player):
        try:
            packet = json.loads(data)
        except:
            return
        if "id" in packet and packet["id"] == PACKET_PLAYER_PLAY_ID:
            if player is self.player1 and 'pos' in packet and len(packet['pos']) == 2:
                self.player1_pos[Y] = packet["pos"][1]
            if player is self.player2 and 'pos' in packet and len(packet['pos']) == 2:
                self.player2_pos[Y] = packet["pos"][1]
        if "id" in packet and packet["id"] == PACKET_INIT_CONFIRM_ID:
            if player is self.player1:
                self.player1_inited = 1
            if player is self.player2:
                self.player2_inited = 1

    async def player_disconnected(self, player):
        # if game blocked
        if self.is_game_blocked:
            await player.close()
            return

        # and inutile en theorie mais parano
        if self.player_count == 1 and self.player1 is player:
            await self.player1.close()
            self.player1 = None
            self.player_count -= 1
            return
        
        if self.winner is None:
            if player is self.player1:
                self.winner = self.player2.user
            else:
                self.winner = self.player1.user
            self.reason = 'disconnection'
        await player.close()
        return

    def create_game_in_database(self):
        try:
            self.db_game = Matches(
                player_1  = self.player1.user.id,
                player_2  = self.player2.user.id,
                status    = 0,
                config    = str(self.config),
                game_type = self.game_type,
            )
            self.db_game.save()
            return True
        except:
            return False
        return False

    def update_game_in_database(self):
        self.db_game.player_1_score = self.score[X]
        self.db_game.player_2_score = self.score[Y]
        self.db_game.duration = int(self.ended_at - self.started_at)
        if self.winner is self.player1.user:
            self.db_game.status = 1
        elif self.winner is self.player2.user:
            self.db_game.status = 2
        else:
            self.db_game.status = 3
        try:
            self.db_game.save()
        except:
            pass
        return

    async def block_game(self):
        await self.disconnect_players()
        self.is_game_blocked = True
        self.player_count = 2
        return
    
    def get_id(self):
        if self.db_game != None:
            return self.db_game.id
        return 0
    
    async def disconnect_players(self):
        if self.player1:
            await self.player1.close()
        if self.player2:
            await self.player2.close()
        return
    
    def get_started_at(self):
        return self.started_at
    
    def get_ended_at(self):
        return self.ended_at
    
    def get_looser(self):
        if self.winner is self.player1.user:
            return self.player2.user
        elif self.winner is self.player2.user:
            return self.player1.user
        return None

    def get_players(self):
        if self.player1 == None:
            return []
        elif self.player2 == None:
            return [self.player1.user]
        return [self.player1.user, self.player2.user]

    def is_user_present(self, user):
        if self.player1 != None and self.player1.user.id == user.id:
            return True
        if self.player2 != None and self.player2.user.id == user.id:
            return True
        return False
        
    def is_public_party_available(self):
        if self.player_count < 2 and self.public == 1:
            return True
        return False

    async def destroy_game(self):
        if self.auto_destroy == 1:
            return
        if self.player1 is not None:
            await self.player1.close()
        if self.player2 is not None:
            await self.player2.close()
        destroy_game(self.uuid)
    
    def make_play_packet(self):
        packet = {
            "id": PACKET_PLAY_ID,
            "players": [{
                "width": self.player1_size[0],
                "height": self.player1_size[1],
                "x": self.player1_pos[0],
                "y": self.player1_pos[1],
                "score": self.score[0]},
                {
                "width": self.player2_size[0],
                "height": self.player2_size[1],
                "x": self.player2_pos[0],
                "y": self.player2_pos[1],
                "score": self.score[1]}],
            "ball": {
                "x": self.ball_pos[0],
                "y": self.ball_pos[1],
                "width": self.ball_size[0],
                "height": self.ball_size[1],
                "direction": self.ball_direction,
                "velocity": self.ball_velocity
            },
            "cooldown": self.cooldown,
            "remaining_time": int(self.end_time - time.time())
        }
        return json.dumps(packet)

    def make_init_packet(self):
        packet = {
            "id": PACKET_INIT_ID,
            "width": self.width,
            "height": self.height,
            "players": [{
                "id": self.player1.user.id,
                "username": self.player1.user.username
            },{
                "id": self.player2.user.id,
                "username": self.player2.user.username
            }]
        }
        return json.dumps(packet)

    def make_finish_packet(self):
        packet = {
            "id": PACKET_FINISH_ID,
            "winner": self.winner.id if self.winner else None,
            "reason": self.reason,
        }
        return json.dumps(packet)

def destroy_game(uuid):
    global games
    del games[uuid]

games = {}

