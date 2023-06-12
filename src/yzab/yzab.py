import threading
from yzab.app import run_server
from yzab.data_manager import data_manager
import pandas as pd

def show(df: pd.DataFrame):
    data_id = data_manager.save_data(df)
    print(f"Data saved with ID: {data_id}")

    t = threading.Thread(target=run_server)
    t.start()