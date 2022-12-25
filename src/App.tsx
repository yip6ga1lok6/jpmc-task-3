import React, { Component } from "react";
import DataStreamer, { ServerRespond } from "./DataStreamer";
import Graph from "./Graph";
import "./App.css";

interface IState {
  data: ServerRespond[];
  showGraph: boolean;
  historicalData: ServerRespond[][]; //store the historical data to compute the running average
  historicalDataReferencePeriod: number; //to indicate whether a period worth of data is ready
  daysElapsed: number; //to indicate how many days has passed since initiation
  ratioRunningAverage: number; //the running average of ratio for a defined period of time
  ratioRunningAverageReady: boolean; //whether at least 1 period cycle has elasped, i.e. have enough data
}

class App extends Component<{}, IState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      data: [],
      showGraph: false,
      historicalData: [],
      historicalDataReferencePeriod: 100, // set the reference period of the ratio moving average here
      daysElapsed: 0,
      ratioRunningAverage: 1,
      ratioRunningAverageReady: false,
    };
  }

  renderGraph() {
    if (this.state.showGraph) {
      return (
        <Graph
          data={this.state.data}
          historicalData={this.state.historicalData}
          historicalDataReferencePeriod={
            this.state.historicalDataReferencePeriod
          }
          daysElapsed={this.state.daysElapsed}
          ratioRunningAverage={this.state.ratioRunningAverage}
          ratioRunningAverageReady={this.state.ratioRunningAverageReady}
        />
      );
    }
  }

  getDataFromServer() {
    //called once upon clicking
    let x = 0;
    const interval = setInterval(() => {
      // set on loop per 100ms
      DataStreamer.getData((serverResponds: ServerRespond[]) => {
        //retrieve daily data from server
        this.setState({
          data: serverResponds,
          showGraph: true,
          historicalData: [...this.state.historicalData, serverResponds],
          daysElapsed: this.state.daysElapsed + 1,
        });
      });
      x++;

      // calculate the average ratio after a designated period of data points
      // this will only run once, for calculating initial sliding window average
      console.log("x: " + x);
      console.log("running average: " + this.state.ratioRunningAverage);
      if (x == this.state.historicalDataReferencePeriod) {
        this.setState({
          ratioRunningAverageReady: true,
          ratioRunningAverage:
            this.state.historicalData
              .map((dailyData) => {
                return (
                  (dailyData[0].top_bid.price + dailyData[0].top_ask.price) /
                  (dailyData[1].top_bid.price + dailyData[1].top_ask.price)
                );
              })
              .reduce((a, b) => a + b) /
            this.state.historicalDataReferencePeriod,
        });
      }
      if (x > this.state.historicalDataReferencePeriod) {
        //sliding window average
        //add the weighing of the latest ratio
        //remove the weighting of the oldest ratio
        const latestRatio =
          (this.state.data[0].top_bid.price +
            this.state.data[0].top_ask.price) /
          (this.state.data[1].top_bid.price + this.state.data[1].top_ask.price);
        const oldestRatio =
          (this.state.historicalData[0][0].top_bid.price +
            this.state.historicalData[0][0].top_ask.price) /
          (this.state.historicalData[0][1].top_bid.price +
            this.state.historicalData[0][1].top_ask.price);

        this.setState({
          ratioRunningAverage:
            (this.state.ratioRunningAverage *
              this.state.historicalDataReferencePeriod -
              oldestRatio +
              latestRatio) /
            this.state.historicalDataReferencePeriod,
          historicalData: this.state.historicalData.slice(1), //remove the oldest data in a period
        });
      }
      if (x > 1000) {
        clearInterval(interval);
      }
      // console.log(this.state.historicalData);
    }, 100);
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">Bank Merge & Co Task 3</header>
        <div className="App-content">
          <button
            className="btn btn-primary Stream-button"
            onClick={() => {
              this.getDataFromServer();
            }}
          >
            Start Streaming Data
          </button>
          <div className="Graph">{this.renderGraph()}</div>
        </div>
      </div>
    );
  }
}

export default App;
