from __future__ import annotations
import threading
from . import app
from .app import start_server
from .data_manager import data_manager
import pandas as pd


def show(df: pd.DataFrame, plot_config: list, name: str = None, port: int = 8888):
    success = start_server(port)
    if not success:
        raise RuntimeError("Failed to start server")

    data_id = data_manager.save_data(df, plot_config, name)
    print(f"Data saved with ID: {data_id}")
