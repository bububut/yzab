import threading
import sys
sys.path.append('/home/shiwei/code/yzab/src')
import pandas as pd
from yzab.data_manager import data_manager
from yzab.app import run_server, stop_server



t = threading.Thread(target=run_server)
t.start()

print('return to main thread')

df = pd.DataFrame({'a': [1,2,3], 'b': [4,5,6]})
resid = data_manager.save_data(df)
print(f'df saved as {resid}')
