CREATE TABLE users (
       id                   serial PRIMARY KEY,
       username             character varying(32) UNIQUE NOT NULL,
       password             character varying(127) NOT NULL,
       email                character varying(127) UNIQUE NOT NULL,
       flags                integer NOT NULL DEFAULT 0,
       created_at           timestamp NOT NULL DEFAULT NOW(),
       creation_ip          character varying(127) NOT NULL,
       avatar_updated_at    timestamp NOT NULL DEFAULT NOW()
);

CREATE TABLE token (
       id         serial PRIMARY KEY,
       created_at timestamp NOT NULL DEFAULT NOW(),
       token      character varying(127) NOT NULL,
       account_id integer NOT NULL,
       expires_at timestamp NOT NULL,
       login_ip   character varying(127) NOT NULL,
       user_agent text NOT NULL
);

CREATE TABLE friends (
       id          serial PRIMARY KEY,
       sender      integer NOT NULL,
       receiver    integer NOT NULL,
       -- 0 pending
       -- 1 accepted
       -- 2 refused
       -- 3 sender removed
       -- 4 receiver removed
       status      smallint NOT NULL,
       created_at  timestamp NOT NULL DEFAULT NOW(),
       accepted_at timestamp,
       updated_at  timestamp NOT NULL DEFAULT NOW()
);

CREATE TABLE matches (
       id             serial PRIMARY KEY,
       player_1       integer NOT NULL,
       player_2       integer NOT NULL,
       -- 0 - not started
       -- 1 - player 1 won
       -- 2 - player 2 won
       -- 3 - draw
       -- 4 - cancelled
       status         smallint NOT NULL,
       player_1_score smallint NOT NULL DEFAULT 0,
       player_2_score smallint NOT NULL DEFAULT 0,
       duration       smallint NOT NULL DEFAULT 0,
       config         text NOT NULL,
       created_at     timestamp NOT NULL DEFAULT NOW(),
       -- 0 unknown
       -- 1 custom game
       -- 2 matchmaking game
       -- 3 tournament game
       game_type      smallint NOT NULL
);

CREATE TABLE tournaments (
       id         serial PRIMARY KEY,

       players    integer[8],
       ranks      integer[8],
       matches    integer[7],
       created_at timestamp NOT NULL DEFAULT NOW(),
       duration   smallint NOT NULL DEFAULT 0,
       winner     integer
);

CREATE TABLE blocked_users (
       id serial PRIMARY KEY,

       blocker integer NOT NULL,
       blocked integer NOT NULL
);

CREATE TABLE channels (
       id     serial PRIMARY KEY,

       created_at    timestamp NOT NULL DEFAULT NOW(),
       users         integer[2] NOT NULL
);

CREATE TABLE messages (
       id                   serial PRIMARY KEY,

       sender               integer NOT NULL,
       channel_id           integer NOT NULL,
       created_at           timestamp NOT NULL DEFAULT NOW(),
       game_key             char(36),
       tournament_key       char(36),
       content              character varying(127) NOT NULL
);
