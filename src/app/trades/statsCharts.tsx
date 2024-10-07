"use client";
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { NextPage } from "next";
import styles from './page.module.css';
import { format } from 'date-fns';

// Define the type for the new trade data
interface TradeData {
  symbol: string;        // Trade symbol
  entryPrice: number;   // Entry price of the trade
  exitPrice: number;    // Exit price of the trade
  type: string;         // Type of the trade (buy/sell)
  duration: number;     // Duration in minutes (or however you measure it)
  profitLoss: number;   // Profit or loss from the trade
}

// Define the type for chart data
interface ChartData {
  name: string;         // Trade symbol or date as a string
  totalLength: number;  // Duration or any metric to be displayed on Y-axis
}

// StatsChart component
const StatsChart: NextPage<{ data: TradeData[]; className?: string }> = ({ data, className = "" }) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    // Map the trade data to the chart data format
    const mappedData = data.map(trade => ({
      name: trade.symbol,  // Using symbol as the X-axis label
      totalLength: trade.duration, // Duration on the Y-axis
    }));

    setChartData(mappedData);
  }, [data]);

  return (
    <div className={[styles.statsChartPlaceholder, className].join(" ")}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="25%" stopColor="#af7dff" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#af7dff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="none" stroke="var(--dark3)" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, dy: 10 }}
            axisLine={false}
            tickLine={false}
            // Optionally format X-axis labels if needed
          />
          <YAxis
            tickFormatter={(value = 0) => {
              const hours = Math.floor(value / 60);
              const minutes = value % 60;
              return `${hours}h ${minutes}m`; // Displaying duration
            }}
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ payload, label }) => {
              if (payload && payload.length) {
                const totalLengthInMinutes = payload[0]?.value as number || 0; // Assert as number
                const hours = Math.floor(totalLengthInMinutes / 60);
                const minutes = totalLengthInMinutes % 60;
                return (
                  <div style={{ border: '0px', borderRadius: '10px', backgroundColor: 'rgba(0, 0, 0, 0.4)', color: '#fff', fontSize: '12px' }}>
                    <p>{label}</p>
                    <p>Length: {hours}h {minutes}m</p>
                  </div>
                );
              }
              return null;
            }}
            itemStyle={{ color: '#fff' }}
          />
          <Area
            type="monotone"
            dataKey="totalLength"
            stroke="#8a41ff"
            fill="url(#colorUv)"
            fillOpacity={0.2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatsChart;
