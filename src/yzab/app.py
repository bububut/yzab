from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from yzab.data_manager import data_manager

app = FastAPI()

server_started = False

@app.get("/api/data/{data_id}")
async def read_data(data_id: str):
    df = data_manager.get_data(data_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Data not found")
    return df.to_dict()

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
    global server_started
    if not server_started:
        server_started = True
        import uvicorn
        uvicorn.run("yzab.app:app", host="0.0.0.0", port=8888)
        # print('in run_server() after uvicorn run')

# add a function to stop the server
# don't stop the server via a request
def stop_server():
    global server_started
    if server_started:
        import uvicorn
        print('in stop_server() before uvicorn stop')
        uvicorn.stop()
        server_started = False
