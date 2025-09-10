import json
import os

with open("/var/www/pong/config.js", "w") as fp:
    fp.write(f"OAUTH_CLIENT_ID={json.dumps(os.getenv('OAUTH_UID'))}\r\n")
    fp.write(f"OAUTH_CALLBACK={json.dumps(os.getenv('OAUTH_CALLBACK'))}\r\n")
