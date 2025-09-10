import threading
import asyncio
import time

def thread_func(loop):
    asyncio.set_event_loop(loop)
    loop.run_forever()

event_loop = asyncio.new_event_loop()
    
event_loop_thread = threading.Thread(target=thread_func, args=(event_loop,))
event_loop_thread.start()
