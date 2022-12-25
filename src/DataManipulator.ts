import { ServerRespond } from "./DataStreamer";

export interface Row {
  price_abc: number;
  price_def: number;
  ratio: number;
  timestamp: Date;
  upper_bound: number;
  lower_bound: number;
  trigger_alert: number | undefined;
}

export class DataManipulator {
  static generateRow(
    serverResponds: ServerRespond[],
    historicalDataReady: boolean,
    ratioRunningAverage: number
  ): Row {
    const priceABC =
      (serverResponds[0].top_ask.price + serverResponds[0].top_bid.price) / 2;
    const priceDEF =
      (serverResponds[1].top_ask.price + serverResponds[1].top_bid.price) / 2;
    let ratio: number;
    if (priceDEF == 0) {
      ratio = 10; //in case of division by zero
    } else {
      ratio = priceABC / priceDEF;
    }
    // dummy bounds when the moving average has yet to be calculated
    let upperBound: number = 1 + 0.05;
    let lowerBound: number = 1 - 0.05;

    console.log("reference ratio available: " + historicalDataReady);
    //once the moving average is available, use it for reference
    if (historicalDataReady) {
      upperBound = ratioRunningAverage + 0.05;
      lowerBound = ratioRunningAverage - 0.05;
    }
    return {
      price_abc: priceABC,
      price_def: priceDEF,
      ratio,
      timestamp:
        serverResponds[0].timestamp > serverResponds[1].timestamp
          ? serverResponds[0].timestamp
          : serverResponds[1].timestamp,
      upper_bound: upperBound,
      lower_bound: lowerBound,
      trigger_alert:
        ratio > upperBound || ratio < lowerBound ? ratio : undefined,
    };
  }
}
