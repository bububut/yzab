# yzab

`yzab` is a tool for interactive candlestick & indicators chart.
You can process data in python, make indicators, generate trading signals, then plot them in an interacitve chart along with the original candlestick.
It helps debugging indicators visually and brings you new trading ideas.

Previously I use plotly to achieve such purpose but it's interactive experience is barely satisfactory.
For `yzab` I'm using `lightweight-charts` since I'm more familiar and comfortable with TradingView's UI logic.


# Changelog

* 0.3.0: User can specify server port when calling `yzab.show`, default 8888.
* 0.2.0: Add support for multiple panes in one chart.
* 0.1.0: Basic functionaliy.