import numpy as np
import time
import uvicorn
import asyncio
import threading
from fastapi import FastAPI, HTTPException
from fastapi.responses import ORJSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from .data_manager import data_manager


app = FastAPI(default_response_class=ORJSONResponse)


server = None
server_port = 8888
server_thread = None


@app.get("/api/data/{data_id}")
async def read_data(data_id: str):
    data = data_manager.get_data(data_id)
    if data is None:
        raise HTTPException(status_code=404, detail="Data not found")

    # whatever filter methods
    df = data["data"].iloc[:10000]

    res = {
        "plot_config": data["plot_config"],
        "data": df[data["required_columns"]].to_dict(orient="records"),
    }
    return res


@app.get("/api/data_catalog")
async def get_data_catalog():
    return data_manager.get_data_catalog()


@app.delete("/api/data/{data_id}")
async def delete_data(data_id: str):
    data_manager.delete_data(data_id)
    return {"message": "Data deleted successfully"}


# Mount the static folder to serve static files
app.mount(
    "/",
    StaticFiles(directory=Path(__file__).parent / "static", html=True),
    name="static",
)


def start_server(port):
    global server, server_port, server_thread
    if server is None:
        print("starting new server...")
        config = uvicorn.Config("yzab.app:app", host="0.0.0.0", port=port)
        server = uvicorn.Server(config)
        server_thread = threading.Thread(daemon=False, target=server.run)
        server_thread.start()

    # wait for server to start
    time.sleep(0.5)
    if server.started:
        server_port = port
        return True

    # server failed to start
    server_thread.join()
    server = None
    server_thread = None
    return False


# add a function to stop the server
# don't stop the server via a request
def stop_server():
    global server, server_thread
    print(f"{server=}")
    if server is not None:
        server.should_exit = True
        server_thread.join()
        server = None
        server_thread = None
