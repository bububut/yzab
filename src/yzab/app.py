import numpy as np

from fastapi import FastAPI, HTTPException
from fastapi.responses import ORJSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from .data_manager import data_manager


app = FastAPI(default_response_class=ORJSONResponse)

server_started = False

@app.get("/api/data/{data_id}")
async def read_data(data_id: str):
    data = data_manager.get_data(data_id)
    if data is None:
        raise HTTPException(status_code=404, detail="Data not found")

    # whatever filter methods
    df = data['data'].iloc[:10000]

    res = {
        'plot_config': data['plot_config'],
        'data': df[data['required_columns']].to_dict(orient='records'),
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
app.mount("/", StaticFiles(directory=Path(__file__).parent / "static", html=True), name="static")


def run_server():
    import uvicorn
    uvicorn.run("yzab.app:app", host="0.0.0.0", port=8888)
    print('in run_server() after uvicorn run')


def start_server():
    global server_started
    if not server_started:
        server_started = True
        import threading
        t = threading.Thread(target=run_server)
        t.start()
        print('in start_server() after t.start()')


# add a function to stop the server
# don't stop the server via a request
def stop_server():
    global server_started
    if server_started:
        import uvicorn
        print('in stop_server() before uvicorn stop')
        uvicorn.stop()
        server_started = False
