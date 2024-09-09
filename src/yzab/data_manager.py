from __future__ import annotations
import pandas as pd
import numpy as np
# import uuid
import copy

class DataManager:
    def __init__(self):
        self.data_store = {}

    def save_data(self, df: pd.DataFrame, plot_config: list, name: str = None) -> str:
        # data_id = str(uuid.uuid4())
        if name is None:
            name = f'Data #{len(self.data_store)}'
        data_id = name
            
        
        df = df.copy()
        plot_config = copy.deepcopy(plot_config)

        required_columns = []
        for cfg in plot_config:
            if cfg['type'] == 'candlestick':
                for col in ['open', 'high', 'low', 'close']:
                    if col not in df.columns:
                        raise ValueError(f'Column {col} is required for candlestick plot')
                cfg['name'] = ''
                required_columns += ['open', 'high', 'low', 'close']
            else:
                col = cfg['name']
                if col not in df.columns:
                    raise ValueError(f'Column {col} is required')
                # `time` is a required field for `lightweight-charts`
                if col == 'time':
                    col = 'time_'
                    df['time_'] = df['time']
                required_columns += [col]
            
            if 'yaxis' not in cfg:
                cfg['yaxis'] = 'right'
            
            # 添加默认的 pane id
            if 'pane' not in cfg:
                cfg['pane'] = 0
            
            colorname = cfg.get('color', 'cyan')
            colormap = {
                'blue': '#1f77b4', 'orange': '#ff7f0e', 'green': '#2ca02c', 'red': '#d62728', 'purple': '#9467bd',
                'brown': '#8c564b', 'pink': '#e377c2', 'gray': '#7f7f7f', 'olive': '#bcbd22', 'cyan': '#17becf',
                'black': '#000000', 'white': '#ffffff'
                }
            if colorname.startswith('#'):
                pass
            else:
                cfg['color'] = colormap.get(colorname, '#1f77b4')

        
        df['time'] = (df.index.astype(np.int64) // 1e9).astype(np.int32)
        required_columns.append('time')

        
        self.data_store[data_id] = {
            'name': name,
            'data': df,
            'required_columns': required_columns,
            'plot_config': plot_config,
        }
        return data_id

    def get_data(self, data_id: str) -> pd.DataFrame:
        return self.data_store.get(data_id)

    def get_data_catalog(self) -> dict:
        res = []
        for data_id, data in self.data_store.items():
            res.append({
                'id': data_id,
                'name': data['name'],
                'shape': data['data'].shape
            })
        return res

    def delete_data(self, data_id: str) -> None:
        if data_id in self.data_store:
            del self.data_store[data_id]
    
data_manager = DataManager()
