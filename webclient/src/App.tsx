import React, { useEffect, useState } from 'react';
import './App.css';
import { Row, Col, List, Typography } from 'antd';
import TheChart, { PlotData } from './TheChart';

interface DataItem {
  id: string;
  name: string;
  shape: number[];
}

const baseURL = ''


const App: React.FC = () => {
  // for list
  const [dataList, setDataList] = useState<DataItem[]>([]);

  const fetchDataList = async () => {
    const response = await fetch(baseURL + '/api/data_catalog');
    // console.log(await response.text());
    const data = await response.json();
    setDataList(data);
  };

  // for chart
  const [chartData, setChartData] = useState<PlotData | null>(null);

  const fetchDataById = async (id: string) => {
    const response = await fetch(baseURL + `/api/data/${id}`);
    const data = await response.json();

    // console.log(data);
    // add 8 hours to `time` field of each item in `data` because lightweigh-chart always show UTC time
    // data.forEach((item: any) => {
    //   item.time += 28800;
    // });
    setChartData(data);
  };

  useEffect(() => {
    fetchDataList();
  }, []);

  return (
    <div className="App">
      <Row style={{ height: '100%' }}>
        <Col span={20}>
          <div className="chart-container">
            <TheChart plotData={chartData} />
          </div>
        </Col>
        <Col span={4}>
          <div className="list-container">
            <List
              dataSource={dataList}
              renderItem={(item: DataItem) => (
                <List.Item onClick={() => fetchDataById(item.id)}>
                  <Typography.Text>{item.name}</Typography.Text>
                  <Typography.Text>{`Shape: ${item.shape.join(' x ')}`}</Typography.Text>
                </List.Item>
              )}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default App;
