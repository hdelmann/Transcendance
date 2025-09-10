from .Game import games

def is_user_playing(user):
    for g in games.items():
        if g[1].is_user_present(user) and g[1].get_started_at() != None and g[1].get_ended_at() == None:
            return True
    return False
