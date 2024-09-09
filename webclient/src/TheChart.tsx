import { createChart, IChartApi } from 'lightweight-charts';
import React, { useRef, useEffect } from 'react';

interface PlotConfig {
  type: string;
  name: string;
  pane: number;
  yaxis: string;
  color: string;
  series: any;
}

export interface PlotData {
  plot_config: PlotConfig[];
  data: any[];
}

interface TheChartProps {
  plotData: PlotData | null
}

const TheChart: React.FC<TheChartProps> = ({ plotData }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const paneListRef = useRef<IChartApi[]>([]);
  const panePlotListRef = useRef<any[][]>([]);

  useEffect(() => {
    console.log('chart reloaded');
    console.log(plotData);

    if (chartContainerRef.current && plotData) {
      // add 8 hours to `time` field of each item in `data` because lightweigh-chart always show UTC time
      plotData.data.forEach((item) => {
        item.time += 28800;
      });

      // Determine how many panes are needed based on the 'pane' key in plotData.plot_config
      const panes = new Set(plotData.plot_config.map(cfg => cfg.pane));
      const numPanes = panes.size;
      console.log(`${numPanes} panes needed`);

      // create panes
      const heights = allocatePaneHeights(numPanes);
      for (let i = 0; i < numPanes; i++) {
        // Create a div for each pane
        const paneDiv = document.createElement('div');
        paneDiv.style.width = '100%';
        paneDiv.style.height = `${heights[i]}%`;
        chartContainerRef.current.appendChild(paneDiv);
        const pane = createPaneWithData(paneDiv, plotData, i);
        paneListRef.current.push(pane);
        panePlotListRef.current.push([]);
      }

      // After creating all plots, populate panePlotList
      plotData.plot_config.forEach((cfg) => {
        if (cfg.series) {
          panePlotListRef.current[cfg.pane].push(cfg.series);
        }
      });

      // legend (you may need to adjust this for multiple panes)
      const hasLeftYAxis = plotData.plot_config.some(cfg => cfg.yaxis === 'left');
      const legend = document.createElement('div');
      legend.style.cssText =
        `position: absolute; left: 68px; top: 24px; z-index: 1; color: black; text-align: left;` +
        `font-size: 14px; font-family: sans-serif; line-height: 18px; font-weight: 600;`;
      chartContainerRef.current.appendChild(legend);

      paneListRef.current.forEach((pane, paneIndex) => {
        pane.subscribeCrosshairMove((param: any) => {
          if (param.time) {
            legend.innerHTML = new Date(param.time * 1000).toISOString() + `<br />`;
            const dataPoint = plotData.data.find(item => item.time === param.time);
            if (dataPoint) {
              plotData.plot_config.forEach((cfg) => {
                if (!cfg.series) return;
                if (cfg.type === 'candlestick') {
                  legend.innerHTML += `Open: ${dataPoint.open}<br />High: ${dataPoint.high}<br />Low: ${dataPoint.low}<br />Close: ${dataPoint.close}<br />`;
                } else {
                  const value = dataPoint[cfg.name];
                  legend.innerHTML += `<span style="color: ${cfg.series.options().color};">${cfg.name}: ${value}<span><br />`;
                }
              });
            }
          }
        });
      });

      // Synchronize visible range for all charts
      paneListRef.current.forEach((pane, index) => {
        pane.timeScale().subscribeVisibleLogicalRangeChange(timeRange => {
          if (timeRange !== null) {
            paneListRef.current.forEach((otherChart, otherIndex) => {
              if (index !== otherIndex) {
                otherChart.timeScale().setVisibleLogicalRange(timeRange);
              }
            });
          }
          syncPriceScaleWidth(paneListRef.current, legend);
        });
      });

      // Set visible range for the first pane only
      if (paneListRef.current.length > 0) {
        paneListRef.current[0].timeScale().setVisibleLogicalRange({ from: 0, to: 500 });
      }





      // sync crosshair among all panes
      paneListRef.current.forEach((pane, index) => {
        pane.subscribeCrosshairMove((param: any) => {
          const dataPoint = getCrosshairDataPoint(panePlotListRef.current[index][0], param);
          paneListRef.current.forEach((pane, otherIndex) => {
            if (index !== otherIndex) {
              syncCrosshair(pane, panePlotListRef.current[otherIndex][0], dataPoint);
            }
          });
        });
      });

      // paneListRef.current[0].subscribeCrosshairMove((param: any) => {
      //   console.log(param);
      // });


    }

    return () => {
      paneListRef.current.forEach(chart => chart.remove());
      paneListRef.current = [];
      panePlotListRef.current = [];
      // remove all children of chartContainerRef.current
      if (chartContainerRef.current) {
        while (chartContainerRef.current.firstChild) {
          chartContainerRef.current.firstChild.remove();
        }
      }
    };
  }, [plotData]);

  return <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />;
};

function allocatePaneHeights(paneCount: number): number[] {
  const totalHeight = 100;
  const heights = new Array(paneCount).fill(0);

  const heightMap: { [key: number]: number } = {
    1: 100,
    2: 66,
    3: 55,
    4: 50,
    5: 45,
    6: 40
  };

  heights[0] = heightMap[paneCount] || 33;

  const remainingHeight = totalHeight - heights[0];
  const equalHeight = remainingHeight / (paneCount - 1);

  for (let i = 1; i < paneCount; i++) {
    heights[i] = equalHeight;
  }

  return heights;
}



function syncPriceScaleWidth(panes: IChartApi[], legend: HTMLDivElement) {
  let maxLeftWidth = 0;
  let maxRightWidth = 0;

  // Find the maximum price scale width
  panes.forEach(pane => {
    const leftPriceScale = pane.priceScale('left');
    const rightPriceScale = pane.priceScale('right');

    if (leftPriceScale) {
      maxLeftWidth = Math.max(maxLeftWidth, leftPriceScale.width());
    }
    if (rightPriceScale) {
      maxRightWidth = Math.max(maxRightWidth, rightPriceScale.width());
    }
  });

  // Set all price scales to the maximum width
  panes.forEach(pane => {
    const leftPriceScale = pane.priceScale('left');
    const rightPriceScale = pane.priceScale('right');

    if (leftPriceScale) {
      leftPriceScale.applyOptions({
        minimumWidth: maxLeftWidth,
      })
    }
    if (rightPriceScale) {
      rightPriceScale.applyOptions({
        minimumWidth: maxRightWidth,
      })
    }
  });

  // Adjust legend position based on the new price scale widths
  legend.style.left = `${maxLeftWidth + 24}px`;
}



function getCrosshairDataPoint(series: any, param: any) {
  if (!param.time) {
    return null;
  }
  const dataPoint = param.seriesData.get(series);
  return dataPoint || null;
}

function syncCrosshair(chart: any, series: any, dataPoint: any) {
  if (dataPoint) {
    chart.setCrosshairPosition(dataPoint.value, dataPoint.time, series);
    return;
  }
  chart.clearCrosshairPosition();
}

function createPaneWithData(container: HTMLDivElement, plotData: PlotData, paneIndex: number) {
  // filter plotData, keep only whose cfg.pane equals to pandIndex
  const plotConfigs = plotData.plot_config.filter(cfg => cfg.pane === paneIndex);
  const plotDatas = plotData.data;
  const hasLeftYAxis = plotConfigs.some(cfg => cfg.yaxis === 'left' && cfg.pane === paneIndex);

  const chart = createChart(container, {

    width: container.offsetWidth,
    height: container.offsetHeight,
    leftPriceScale: {
      // visible: hasLeftYAxis,
      visible: true,
    },
    timeScale: {
      visible: paneIndex === 0,
      // visible: true,
      timeVisible: true,
      secondsVisible: true,
    },
    localization: {
      dateFormat: 'yyyy-MM-dd',
    },
    layout: {
      attributionLogo: false,
    },
  });



  const markers: any[] = [];
  plotConfigs.forEach((cfg) => {
    console.log('plot ' + cfg.type);

    if (cfg.type === 'candlestick') {
      // candlestick
      // prepare data
      const data = plotDatas.map(item => ({
        time: item.time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }));
      // console.log(data);

      // plot
      const candlestickSeries = chart.addCandlestickSeries({
        priceScaleId: cfg.yaxis,
        upColor: '#ef5350',
        borderUpColor: '#ef5350',
        downColor: '#26a69a',
        borderDownColor: '#26a69a',
        priceLineVisible: false,
      });
      candlestickSeries.setData(data);
      cfg.series = candlestickSeries;

    } else if (cfg.type === 'line') {
      // line
      // prepare data
      const data = plotDatas.map(item => ({
        time: item.time,
        value: item[cfg.name],
      })).filter(item => item.value !== null);
      // console.log(data);

      // plot
      const lineSeries = chart.addLineSeries({
        priceScaleId: cfg.yaxis,
        title: cfg.name,
        lineWidth: 2,
        color: cfg.color,
        priceLineVisible: false,
      });
      lineSeries.setData(data);
      cfg.series = lineSeries;

    } else if (cfg.type === 'up') {
      plotDatas.forEach((item) => {
        if (item[cfg.name]) {
          markers.push({
            time: item.time,
            position: 'aboveBar',
            color: '#e91e9d',
            shape: 'arrowUp',
            text: 'buy',
          });
        }
      });

    } else if (cfg.type === 'down') {
      plotDatas.forEach((item) => {
        if (item[cfg.name]) {
          markers.push({
            time: item.time,
            position: 'belowBar',
            color: '#1ee963',
            shape: 'arrowDown',
            text: 'sell',
          });
        }
      });
    }
    if (cfg.series) {
      console.log(cfg.series.options());
    }

    // always draw up and down markers on the first series
    if (markers.length > 0 && plotData.plot_config[0].series) {
      markers.sort((a, b) => { return a.time - b.time });
      plotConfigs[0].series.setMarkers(markers);
    }
  });



  return chart;
}

export default TheChart;