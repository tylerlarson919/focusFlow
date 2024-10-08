"use client";
import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import type { NextPage } from "next";
import styles from './page.module.css';
import { Card } from "@nextui-org/react";

interface TradeData {
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  type: string;
  duration: string;  // Duration is a string like "1h 6m"
  profitLoss: number;
  startDate: string;  // Date string for the start time
  risk: number;
}

interface AvgData {
  name: string;
  value: number;
}

const parseDuration = (duration: string | null | undefined) => {
  if (!duration || typeof duration !== 'string') {
    return 0; // return 0 if duration is null, undefined, or not a string
  }

  const timeParts = duration.match(/(\d+)h\s?(\d+)?m?/);
  const hours = timeParts ? parseInt(timeParts[1]) : 0;
  const minutes = timeParts && timeParts[2] ? parseInt(timeParts[2]) : 0;

  return hours * 60 + minutes;
};

const parseTimeOfDay = (startDate: string) => {
  const date = new Date(startDate);
  return date.getHours();
};

const StatsChart: NextPage<{ data: { trades: TradeData[], accountBalance: number, startingBalance: number }; className?: string }> = ({ data, className = "" }) => {
  const [averagePnL, setAveragePnL] = useState<number>(0);
  const [averageLoss, setAverageLoss] = useState<number>(0);
  const [averageProfit, setAverageProfit] = useState<number>(0);
  const [averageRisk, setAverageRisk] = useState<number>(0);
  const [averageDuration, setAverageDuration] = useState<number>(0);
  const [timeOfDayData, setTimeOfDayData] = useState<AvgData[]>([]);
  const [winPercentage, setWinPercentage] = useState<number>(0);
  const [riskToReward, setRiskToReward] = useState<number>(0);
  const [totalPnL, setTotalPnL] = useState<number>(0);
  const [cumulativeBalanceData, setCumulativeBalanceData] = useState<{ name: string; balance: number }[]>([]);
  const [tradePnLData, setTradePnLData] = useState<{ name: string; profitLoss: number }[]>([]);

  useEffect(() => {
    const trades = data.trades;
    
    const totalPnL = trades.reduce((acc, trade) => acc + (Number(trade.profitLoss) || 0), 0);
    const winningTrades = trades.filter(trade => Number(trade.profitLoss) > 0);
    const losingTrades = trades.filter(trade => Number(trade.profitLoss) < 0);
    const totalRisk = trades.reduce((acc, trade) => acc + (Number(trade.risk) || 0), 0);
    const totalDuration = trades.reduce((acc, trade) => acc + parseDuration(trade.duration), 0);
    const totalTrades = trades.length;
    const winTrades = winningTrades.length;
  
    const totalRiskReward = trades.reduce((acc, trade) => {
      const risk = Number(trade.risk) || 0;
      const reward = Number(trade.profitLoss) || 0;
  
      return acc + (risk > 0 ? reward / risk : 0);
    }, 0);
  
    const validTrades = trades.filter(trade => Number(trade.risk) > 0);
    setRiskToReward(validTrades.length ? totalRiskReward / validTrades.length : 0);
  
    setTotalPnL(totalPnL);
    setAveragePnL(totalTrades ? totalPnL / totalTrades : 0);
    setAverageLoss(losingTrades.length ? losingTrades.reduce((acc, trade) => acc + Number(trade.profitLoss) || 0, 0) / losingTrades.length : 0);
    setAverageProfit(winningTrades.length ? winningTrades.reduce((acc, trade) => acc + Number(trade.profitLoss) || 0, 0) / winningTrades.length : 0);
    setAverageRisk(totalTrades ? totalRisk / totalTrades : 0);
    setAverageDuration(totalTrades ? totalDuration / totalTrades : 0);
    setWinPercentage(totalTrades ? (winTrades / totalTrades) * 100 : 0);
  
    const timeOfDayCounts = trades.reduce((acc: Record<string, number>, trade) => {
      const hour = parseTimeOfDay(trade.startDate);
      const range = `${hour % 12 || 12}${hour < 12 ? 'AM' : 'PM'} - ${(hour + 1) % 12 || 12}${hour + 1 < 12 ? 'AM' : 'PM'}`;
      acc[range] = (acc[range] || 0) + 1;
      return acc;
    }, {});
  
    setTimeOfDayData(Object.entries(timeOfDayCounts).map(([name, value]) => ({ name, value })));
  
    // Set cumulative balance data
    const cumulativeData = trades.reduce<{ name: string; balance: number }[]>((acc, trade, index) => {
      const previousBalance = index === 0 ? Number(data.startingBalance) || 0 : acc[index - 1].balance;
      const profitLossAsNumber = Number(trade.profitLoss) || 0; // Ensure it's treated as a number
      const newBalance = previousBalance + profitLossAsNumber; // Add the number
      acc.push({ name: `Trade ${index + 1}`, balance: newBalance });
      return acc;
    }, []);
  
    console.log("cumulative balance data: ", cumulativeData);
    setCumulativeBalanceData(cumulativeData);
  
    // Set trade profit/loss data
    const profitLossData = trades.map((trade, index) => ({
      name: `Trade ${index + 1}`,
      profitLoss: Number(trade.profitLoss) || 0 // Ensure it's treated as a number
    }));
    setTradePnLData(profitLossData);
  
  }, [data]);
  
  

  return (
    <div className={[styles.statsChartPlaceholder, className].join(" ")}>
      <div className={styles.accountSummary}>
        <Card className={`${styles.statCard} ${styles.balanceCard}`}>
            <p className={styles.cardLabel}>Current Balance</p>
            <h2 className={styles.cardAmount}>${data.accountBalance.toFixed(2)}</h2>
        </Card>
        <div className={styles.gridContainer}>
          <Card className={styles.statCard}>
            <p className={styles.cardLabel}>Total PnL</p>
            <p className={totalPnL >= 0 ? styles.positive : styles.negative}>
              {totalPnL >= 0 ? '+' : '-'}${Math.abs(totalPnL).toFixed(2)}
            </p>
          </Card>

          <Card className={styles.statCard}>
            <p className={styles.cardLabel}>Average PnL</p>
            <p className={averagePnL >= 0 ? styles.positive : styles.negative}>
              {averagePnL >= 0 ? '+' : '-'}${Math.abs(averagePnL).toFixed(2)}
            </p>
          </Card>

          <Card className={styles.statCard}>
            <p className={styles.cardLabel}>Average Loss</p>
            <p className={styles.negative}>-${Math.abs(averageLoss).toFixed(2)}</p>
          </Card>

          <Card className={styles.statCard}>
            <p className={styles.cardLabel}>Average Profit</p>
            <p className={styles.positive}>+${averageProfit.toFixed(2)}</p>
          </Card>

          <Card className={styles.statCard}>
            <p className={styles.cardLabel}>Average Risk</p>
            <p className={styles.cardAmount}>{averageRisk.toFixed(2)}%</p>
          </Card>

          <Card className={styles.statCard}>
            <p className={styles.cardLabel}>Risk to Reward</p>
            <p className={styles.cardAmount}>1:{riskToReward.toFixed(2)}</p>
          </Card>

          <Card className={styles.statCard}>
            <p className={styles.cardLabel}>Avg. Trade Duration</p>
            <p className={styles.cardAmount}>{Math.floor(averageDuration / 60)}h {averageDuration % 60}m</p>
          </Card>
        </div>
      </div>

      {/* Cumulative Balance Line Chart */}
      <h3>Cumulative Account Balance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={cumulativeBalanceData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            {/* Remove both horizontal and vertical gridlines */}
            <CartesianGrid vertical={false} horizontal={false} strokeDasharray="none" />
            <XAxis dataKey="name" />
            <YAxis 
              tickFormatter={(value) => `$${value.toFixed(2)}`} 
              domain={[Math.min(...cumulativeBalanceData.map(item => item.balance)), 'auto']} // Set Y-axis start to lowest balance
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div style={{ 
                      backgroundColor: 'var(--dark2)', 
                      borderRadius: '5px', 
                      padding: '10px', 
                      color: '#fff' // Set tooltip text color
                    }}>
                      <p>{`$${Number(payload[0].value).toFixed(2)}`}</p>
                    </div>
                  );
                }
                return null;
              }} 
            />
            <Area 
              type="monotone" 
              dataKey="balance" 
              stroke="#8884d8" 
              fill="#8884d8" 
              strokeWidth={3} // Increase line thickness
            />
          </AreaChart>
        </ResponsiveContainer>




      {/* Profit and Loss Bar Chart */}
      <h3>Trade Profit and Loss</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={tradePnLData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => `$${value.toFixed(2)}`} />
          <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Profit/Loss']} />
          <Bar dataKey="profitLoss" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>

      {/* Time of Day Chart */}
      <h3>Time of Day Trades Occurred</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={timeOfDayData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatsChart;
