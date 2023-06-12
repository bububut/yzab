import pandas as pd
import uuid

class DataManager:
    def __init__(self):
        self.data_store = {}

    def save_data(self, df: pd.DataFrame) -> str:
        data_id = str(uuid.uuid4())
        self.data_store[data_id] = df
        return data_id

    def get_data(self, data_id: str) -> pd.DataFrame:
        return self.data_store.get(data_id)

    def get_data_catalog(self) -> dict:
        return {data_id: {"shape": df.shape} for data_id, df in self.data_store.items()}

    def delete_data(self, data_id: str) -> None:
        if data_id in self.data_store:
            del self.data_store[data_id]

data_manager = DataManager()