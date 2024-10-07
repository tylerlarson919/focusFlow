"use client";
import React, { useState, useEffect } from 'react';
import StatsChart from './statsCharts'
import styles from './page.module.css'; // Adjust the path based on your directory structure
import HeaderMain from '../components/header';
import {
    Input,
    Select,
    SelectItem,
    DateRangePicker,
    Button,
    Table,
    TableHeader,
    TableBody,
    TableColumn,
    TableRow,
    TableCell,
    Divider
} from "@nextui-org/react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from '../../../firebase'; // Import your Firebase config
import { collection, getDocs, query, where, addDoc } from "firebase/firestore"; // Import Firestore functions

const Trades: React.FC = () => {
    const [selectedSymbol, setSelectedSymbol] = useState<string>("");
    const [selectedTradeType, setSelectedTradeType] = useState<string>("");
    const [entryPrice, setEntryPrice] = useState<number>(0);
    const [exitPrice, setExitPrice] = useState<number>(0);
    const [stopLoss, setStopLoss] = useState<number>(0);
    const [takeProfit, setTakeProfit] = useState<number>(0);
    const [shares, setShares] = useState<number>(0);
    const [risk, setRisk] = useState<number>(0);
    const [potentialProfit, setPotentialProfit] = useState<number>(0);
    const [actualProfit, setActualProfit] = useState<number>(0);
    const [userId, setUserId] = useState<string | null>(null);
    const [trades, setTrades] = useState<any[]>([]); // Replace `any` with your trade type
    const auth = getAuth();

    // Chart data function
    const chartData = () => {
        return trades.map(trade => ({
            symbol: trade.symbol,
            entryPrice: trade.entryPrice,
            exitPrice: trade.exitPrice,
            type: trade.type,
            duration: trade.duration,
            profitLoss: trade.exitPrice - trade.entryPrice,
            // Add more fields as needed
        })) || [];
    };

    const symbols = [
        { key: 'AAPL', label: 'Apple (AAPL)' },
        { key: 'TSLA', label: 'Tesla (TSLA)' },
        { key: 'GOOGL', label: 'Alphabet (GOOGL)' },
        // Add more symbols as needed
    ];

    const tradeTypes = [
        { key: 'long', label: 'Long' },
        { key: 'short', label: 'Short' },
    ];

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
                fetchTrades(user.uid); // Fetch trades for the user when they log in
            } else {
                setUserId(null);
                setTrades([]); // Clear trades when the user logs out
            }
        });

        return () => unsubscribe();
    }, [auth]);

    const fetchTrades = async (uid: string) => {
        try {
            const tradesCollection = collection(db, "trades"); // Change "trades" to your collection name
            const q = query(tradesCollection, where("userId", "==", uid));
            const querySnapshot = await getDocs(q);
            const tradesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTrades(tradesData);
        } catch (error) {
            console.error("Error fetching trades:", error);
        }
    };

    const handleSubmitTrade = async () => {
        if (!userId) return; // Ensure user is authenticated
    
        const newTrade = {
            userId,
            symbol: selectedSymbol,
            type: selectedTradeType,
            entryPrice,
            exitPrice,
            stopLoss,
            takeProfit,
            shares,
            risk,
            potentialProfit,
            actualProfit,
            // Add more fields as needed
        };
    
        try {
            const tradesCollection = collection(db, "trades");
            await addDoc(tradesCollection, newTrade); // Add trade to Firestore
            fetchTrades(userId); // Refresh trades after submission
        } catch (error) {
            console.error("Error submitting trade:", error);
        }
    };

    useEffect(() => {
        // Calculate potential profit
        if (entryPrice && takeProfit) {
            setPotentialProfit((takeProfit - entryPrice) * shares);
        } else {
            setPotentialProfit(0);
        }
    
        // Calculate actual profit
        if (entryPrice && exitPrice) {
            setActualProfit((exitPrice - entryPrice) * shares);
        } else {
            setActualProfit(0);
        }
    }, [entryPrice, takeProfit, exitPrice, shares]);


    return (
        <div className={styles.bg}>
            <div className={styles.header}>
                <HeaderMain className="top-0" />
            </div>
            <div className={styles.topContent}>
                <div className={styles.table}>
                    <Table aria-label="Trades table">
                        <TableHeader>
                            <TableColumn>Symbol</TableColumn>
                            <TableColumn>Type</TableColumn>
                            <TableColumn>Entry Price</TableColumn>
                            <TableColumn>Exit Price</TableColumn>
                            <TableColumn>Duration</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {trades.map((trade) => (
                                <TableRow key={trade.id}>
                                    <TableCell>{trade.symbol}</TableCell>
                                    <TableCell>{trade.type}</TableCell>
                                    <TableCell>${trade.entryPrice}</TableCell>
                                    <TableCell>${trade.exitPrice}</TableCell>
                                    <TableCell>{trade.duration}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className={styles.tradeEntry}>
                    <div className={styles.selectGroup}>
                        <Select size="sm" label="Symbol (symbol names)" className="w-2/4" aria-label="Select symbol" onChange={(e) => setSelectedSymbol(e.target.value)}>
                            {symbols.map((symbol) => (
                            <SelectItem key={symbol.key} value={symbol.key}>
                                {symbol.label}
                            </SelectItem>
                        ))}
                    </Select>
                        <Select size="sm" label="Trade Type (long or short)" className="w-2/4" aria-label="Select trade type" onChange={(e) => setSelectedTradeType(e.target.value)}>
                            {tradeTypes.map((tradeType) => (
                                <SelectItem key={tradeType.key} value={tradeType.key}>
                                    {tradeType.label}
                                </SelectItem>
                            ))}
                    </Select>
                    </div>
                    <div className={styles.priceGroup}>
                        <Input
                            type="number"
                            label="Entry Price"
                            placeholder="0.00"
                            labelPlacement="inside"
                            aria-label="Entry price"
                            value={entryPrice !== null ? entryPrice.toString() : ''} // Convert to string
                            onChange={(e) => setEntryPrice(Number(e.target.value))}
                            endContent={
                                <div className="pointer-events-none flex items-center">
                                    <span className="text-default-400 text-small">$</span>
                                </div>
                            }
                        />
                        <Input
                            type="number"
                            label="Exit Price"
                            placeholder="0.00"
                            labelPlacement="inside"
                            aria-label="Exit price"
                            value={exitPrice !== null ? exitPrice.toString() : ''} // Convert to string
                            onChange={(e) => setExitPrice(Number(e.target.value))}
                            endContent={
                                <div className="pointer-events-none flex items-center">
                                    <span className="text-default-400 text-small">$</span>
                                </div>
                            }
                        />
                    </div>
                    <div className={styles.priceGroup}>
                        <Input
                            type="number"
                            label="Stop Loss"
                            placeholder="0.00"
                            labelPlacement="inside"
                            aria-label="Stop Loss"
                            endContent={
                                <div className="pointer-events-none flex items-center">
                                    <span className="text-default-400 text-small">$</span>
                                </div>
                            }
                        />
                        <Input
                            type="number"
                            label="Take Profit"
                            placeholder="0.00"
                            labelPlacement="inside"
                            value={takeProfit !== null ? takeProfit.toString() : ''} // Convert to string
                            onChange={(e) => setTakeProfit(Number(e.target.value))} // Capture value
                            aria-label="Take Profit"
                            endContent={
                                <div className="pointer-events-none flex items-center">
                                    <span className="text-default-400 text-small">$</span>
                                </div>
                            }
                        />
                    </div>
                    <div className={styles.priceGroup}>
                    <DateRangePicker label="Trade duration" className="w-full" aria-label="Select trade duration" />
                    <Input
                            type="number"
                            label="# of Shares"
                            placeholder="0"
                            labelPlacement="inside"
                            aria-label="# of Shares"
                        />
                    </div>
                    <Divider orientation="horizontal" />
                    <div className={styles.statsGroup}>
                        <Input
                            isReadOnly
                            type="number"
                            label="Risk"
                            placeholder="0.00"
                            labelPlacement="inside"
                            aria-label="Risk Percent"
                            endContent={
                                <div className="pointer-events-none flex items-center">
                                    <span className="text-default-400 text-small">%</span>
                                </div>
                            }
                        />
                        <Input
                            isReadOnly
                            type="number"
                            label="Potential Profit"
                            value={potentialProfit !== null ? potentialProfit.toFixed(2) : '0.00'} // Display calculated value
                            labelPlacement="inside"
                            aria-label="Potential Profit"
                            endContent={
                                <div className="pointer-events-none flex items-center">
                                    <span className="text-default-400 text-small">$</span>
                                </div>
                            }
                        />
                        <Input
                            isReadOnly
                            type="number"
                            label="Actual Profit"
                            value={actualProfit !== null ? actualProfit.toFixed(2) : '0.00'} // Display calculated value
                            labelPlacement="inside"
                            aria-label="Actual Profit"
                            endContent={
                                <div className="pointer-events-none flex items-center">
                                    <span className="text-default-400 text-small">$</span>
                                </div>
                            }
                        />
                    </div>
                    <Button color="secondary" variant="faded" onClick={handleSubmitTrade} aria-label="Submit trade">
                        Submit Trade
                    </Button>
                </div>
            </div>
            <div className={styles.bottomContent}>
                <StatsChart data={chartData()} />
            </div>
        </div>
    );
};

export default Trades;
