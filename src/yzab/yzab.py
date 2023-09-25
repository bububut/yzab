from __future__ import annotations
import threading
from .app import start_server
from .data_manager import data_manager
import pandas as pd

def show(df: pd.DataFrame, plot_config: list, name: str = None):
    start_server()

    data_id = data_manager.save_data(df, plot_config, name)
    print(f"Data saved with ID: {data_id}")
