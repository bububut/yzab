import { createChart } from 'lightweight-charts';
import React, { useRef, useEffect } from 'react';

interface PlotConfig {
  type: string;
  name: string;
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
  const chartRef = useRef<any>(null); // Replace 'any' with the appropriate chart type

  useEffect(() => {
    console.log('chart reload');
    console.log(plotData);

    if (chartContainerRef.current && plotData) {
      const hasLeftYAxis = plotData.plot_config.some(cfg => cfg.yaxis === 'left');

      chartRef.current = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.offsetWidth,
        height: chartContainerRef.current.offsetHeight,
        leftPriceScale: {
          visible: hasLeftYAxis,
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        },
        localization: {
          dateFormat: 'yyyy-MM-dd',
        },
      });

      // add 8 hours to `time` field of each item in `data` because lightweigh-chart always show UTC time
      plotData.data.forEach((item) => {
        item.time += 28800;
      });

      const markers: any[] = [];
      plotData.plot_config.forEach((cfg) => {
        console.log('plot ' + cfg.type);

        if (cfg.type === 'candlestick') {
          // candlestick
          // prepare data
          const data = plotData.data.map(item => ({
            time: item.time,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
          }));
          // console.log(data);

          // plot
          const candlestickSeries = chartRef.current.addCandlestickSeries({
            priceScaleId: cfg.yaxis,
            upColor: '#ef5350',
            borderUpColor: '#ef5350',
            downColor: '#26a69a',
            borderDownColor: '#26a69a',
            pricelineVisible: false,
          });
          candlestickSeries.setData(data);
          cfg.series = candlestickSeries;

        } else if (cfg.type === 'line') {
          // line
          // prepare data
          const data = plotData.data.map(item => ({
            time: item.time,
            value: item[cfg.name],
          })).filter(item => item.value !== null);
          // console.log(data);

          // plot
          const lineSeries = chartRef.current.addLineSeries({
            priceScaleId: cfg.yaxis,
            title: cfg.name,
            lineWidth: 1.5,
            color: cfg.color,
            priceLineVisible: false,
          });
          lineSeries.setData(data);
          cfg.series = lineSeries;

        } else if (cfg.type === 'up') {
          plotData.data.forEach((item) => {
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
          plotData.data.forEach((item) => {
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
          plotData.plot_config[0].series.setMarkers(markers);

        }
      });

      // legend
      const legend = document.createElement('div');
      legend.style.cssText =
        `position: absolute; left: ${hasLeftYAxis ? 100 : 12}px; top: 12px; z-index: 1; color: black; text-align: left;` +
        `font-size: 14px; font-family: sans-serif; line-height: 18px; font-weight: 600;`;
      chartContainerRef.current.appendChild(legend);

      chartRef.current.subscribeCrosshairMove((param: any) => {
        // console.log(param);
        if (param.time) {
          legend.innerHTML = new Date(param.time * 1000).toISOString() + `<br />`;
          plotData.plot_config.forEach((cfg) => {
            if (!cfg.series) return;
            const data = param.seriesData.get(cfg.series);
            if (cfg.type === 'candlestick') {
              legend.innerHTML += `Open: ${data.open}<br />High: ${data.high}<br />Low: ${data.low}<br />Close: ${data.close}<br />`;
            } else {
              legend.innerHTML += `<span style="color: ${cfg.series.options().color};">${cfg.name}: ${data.value}<span><br />`;
            }
            
          });
        }

      });


    }

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [plotData]);

  return <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />;
};

export default TheChart;