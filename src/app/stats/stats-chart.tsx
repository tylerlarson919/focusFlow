"use client";
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { NextPage } from "next";
import styles from './page.module.css';
import { format } from 'date-fns';

// Function to convert length string to minutes
const convertLengthToMinutes = (length: string): number => {
  const regex = /(\d+)h?\s*(\d+)m?/;
  const matches = length.match(regex);
  if (!matches) return 0;
  
  const hours = matches[1] ? parseInt(matches[1], 10) : 0;
  const minutes = matches[2] ? parseInt(matches[2], 10) : 0;
  return hours * 60 + minutes;
};

// Function to parse date from various formats
const parseDate = (timestamp: any): Date | null => {
  if (!timestamp) {
    console.error('Timestamp is undefined or null');
    return null;
  }
  
  try {
    if (timestamp.toDate) {
      return timestamp.toDate();
    } else if (typeof timestamp === 'string') {
      const parsed = new Date(timestamp);
      if (isNaN(parsed.getTime())) {
        // Invalid date string, log the issue
        console.error(`Invalid date string: ${timestamp}`);
        return null;
      }
      return parsed;
    } else if (typeof timestamp === 'number') {
      // Handling Unix timestamps (milliseconds)
      return new Date(timestamp);
    }
    return null;
  } catch (error) {
    console.error(`Error converting timestamp: ${timestamp}`, error);
    return null;
  }
};




// Function to sort data by date
const sortDataByDate = (data: { name: string; totalLength: number }[]) => {
  return data.sort((a, b) => {
    const dateA = parseDate(a.name);
    const dateB = parseDate(b.name);
    if (!dateA || !dateB) return 0;
    return dateA.getTime() - dateB.getTime();
  });
};

// Define the type for chart data
interface ChartData {
  name: string;
  totalLength: number;
}

// StatsChart component
const StatsChart: NextPage<{ data: { name: string; totalLength: number }[]; className?: string }> = ({ data, className = "" }) => {
  const [chartData, setChartData] = useState<ChartData[]>(data);

  useEffect(() => {
    const sortedData = sortDataByDate(data);
    console.log('Chart Data:', sortedData);
    setChartData(sortedData);
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
              <stop offset="25%" stopColor="#af7dff" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#af7dff" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="none" stroke="var(--dark3)" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, dy: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(name = '') => {
              const parsedDate = parseDate(name);
              return parsedDate ? format(parsedDate, 'MMM dd, yyyy') : name;
            }}
          />

          <YAxis
            tickFormatter={(value = 0) => {
              const hours = Math.floor(value / 60);
              return `${hours}h`;
            }}
            tick={{ fontSize: 12}}
            axisLine={false}
            tickLine={false}
          />
          
          <Tooltip
            content={({ payload, label }) => {
              if (payload && payload.length) {
                const totalLengthInMinutes = payload[0]?.value as number || 0; // Assert as number and default to 0 if undefined
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
