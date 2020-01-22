/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */
import * as React from "react";
import { Bars } from "./Bars";
import { Grid } from "./Grid";
import { Ticks } from "./Ticks";
import { Labels } from "./Labels";

import { DataEntry, MeasureData, CategoryData } from "../../dataInterfaces";
import { getStringLength } from "../../helpers";

import {
    TICKS_HEIGHT,
    BAR_HEIGHT,
    LEGEND_HEIGHT,
    LABELS_PADDING,
    CHART_PADDING,
    LINE_COLOR
} from "../../constants";

export interface Entry extends DataEntry {
    width?: number;
    height?: number;
    y: number;
}

export interface ChartProps {
  width?: number;
  height?: number;
  entries?: DataEntry[];
  measures?: MeasureData[];
  category?: CategoryData;
  showTooltip?: (tooltipEntry: DataEntry) => void;
  hideTooltip?: () => void;
  legendHeight?: number;
}

export const BarChart: React.FunctionComponent<ChartProps> = (
    props: ChartProps
) => {
    const {
        measures,
        category,
        height,
        width,
        showTooltip,
        hideTooltip
    } = props;

    if (!props.entries) return <div>No Entries</div>;
    const labelsWidth: number = category.maxWidth + LABELS_PADDING;
    const chartHeight: number = BAR_HEIGHT * props.entries.length;
  
    const legendHeight: number = props.legendHeight || LEGEND_HEIGHT;
  
    let entries = props.entries
      .map(entry => {
        let rechartsEntry = { ...entry };
        entry.dataPoints.forEach(element => {
          rechartsEntry[`value${element.measureIndex}`] = element.value;
        });
        return rechartsEntry;
      })
      .sort((a: DataEntry, b: DataEntry) =>
        a.dataPoints[0].value < b.dataPoints[0].value
          ? 1
          : a.dataPoints[0].value > b.dataPoints[0].value
          ? -1
          : 0
      );
  
    const maxEntry = entries.reduce(
      (acc, v) => (acc.sum > v.sum ? acc : v),
      entries[0]
    );
    const domainMax: number = Math.max(maxEntry.sum, 0);
  
    const minEntry = entries.reduce(
      (acc, v) => (acc.sum < v.sum ? acc : v),
      entries[0]
    );
  
    const domainMin: number = Math.min(minEntry.sum, 0);
    const domain: number[] = [domainMin, domainMax];
  
    const calculateTicks = (domainMax: number, domainMin: number) => {
      const pow = String(
        Math.floor( Math.max( Math.abs(domainMax), Math.abs(domainMin) ) )
      ).length - 1;
  
      const positiveTicksCount = 1 + Number(String(Math.floor(domainMax))[0]);
      const negativeTicksCount = (domainMin < 0) ? Number(String(Math.floor(Math.abs(domainMin)))[0]) : 0;
  
      const ticksPerTen = (positiveTicksCount + negativeTicksCount < 5) ? 2 : 1;
  
      const ticks = [];
  
      if (domainMin < 0) {
        for (let i = negativeTicksCount; i > 0; i--) {
          ticks.push(-i * Math.pow(10, pow));
          if (ticksPerTen === 2) {
            ticks.push(-(i + .5) * Math.pow(10, pow));
          }
        }
      }
  
      for (let i = 0; i < positiveTicksCount; i++) {
        ticks.push(i * Math.pow(10, pow));
        if (ticksPerTen === 2) {
          ticks.push((i + .5) * Math.pow(10, pow));
        }
      }
  
      return ticks;
    };
  
    let tickValues: number[] = calculateTicks(domainMax, domainMin);
  
    const scroll: boolean = height - TICKS_HEIGHT - legendHeight < chartHeight;
    const chartWidth: number = width - CHART_PADDING;
  
    const tickWidth: number = chartWidth/ tickValues.length;
    const largestTick: string = tickValues.reduce( (acc, value) => value.toString().length > acc.length ? value.toString() : acc, '');
  
    if (tickWidth < getStringLength(largestTick )) {
      tickValues = tickValues.filter((value, index) => (!(index % 2)) ); //TODO GOOD
    }

    const lines = tickValues.map(value => ({
        value,
        y: 0,
        x: chartWidth * (value / domainMax)
    }));

    const ticks = tickValues.map(value => ({
        value,
        y: 0,
        x: chartWidth * (value / domainMax)
    }));
    console.warn('legendHeight', legendHeight);

    return (
        <div className="bar-chart">
            <div
                className="bar-chart-body"
                style={{
                  height: Math.min(height - TICKS_HEIGHT - legendHeight, chartHeight),
                  maxHeight: Math.min(height - TICKS_HEIGHT - legendHeight, chartHeight),
                  width,
                  borderBottom: `1px solid ${LINE_COLOR}`,
                  overflowY: scroll ? "scroll" : "hidden",
                }}
            >
                <div className="bar-chart-svg-wrapper"
                  style={{
                    maxHeight: chartHeight,
                    height: chartHeight,
                    width: chartWidth
                  }}
                >
                    <svg height={chartHeight} width={width}>
                    <Grid
                        x={labelsWidth}
                        y={0}
                        height={chartHeight}
                        width={width}
                        lines={lines}
                    />
                    <Bars
                        entries={entries}
                        measures={measures}
                        width={chartWidth}
                        height={chartHeight}
                        x={labelsWidth}
                        showTooltip={showTooltip}
                        hideTooltip={hideTooltip}
                    />
                    <Labels
                        x={0}
                        y={0}
                        entries={entries}
                        width={labelsWidth}
                        height={chartHeight}
                    />
                </svg>
                </div>
            </div>
            <div
                className="bar-chart-footer"
                style={{ height: TICKS_HEIGHT, width }}
            >
                <svg
                    height={TICKS_HEIGHT}
                    width={width}
                >
                    <Ticks
                        height={TICKS_HEIGHT}
                        width={width}
                        ticks={ticks}
                        x={labelsWidth}
                        y={0}
                    />
                </svg>
            </div>
        </div>
    );
};
