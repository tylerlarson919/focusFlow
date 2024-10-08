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
    Divider,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Modal,
    ModalBody,
    ModalHeader,
    ModalFooter,
    Textarea 
} from "@nextui-org/react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from '../../../firebase'; // Import your Firebase config
import { Firestore, collection, getDocs, query, where, addDoc, setDoc, doc } from "firebase/firestore"; // Import Firestore functions
import { cp } from 'fs';
import {parseZonedDateTime, parseAbsoluteToLocal} from "@internationalized/date";

const Trades: React.FC = () => {
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
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
    const [accounts, setAccounts] = useState<any[]>([]); // Replace `any` with your account type
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [newAccountName, setNewAccountName] = useState<string>("");
    const [startingBalance, setStartingBalance] = useState<number>(0);
    const [notes, setNotes] = useState<string>("");

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

    const fetchAccounts = async (uid: string) => {
        if (!uid) return; // Ensure uid is not null
    
        try {
            const accountsCollection = collection(db, "trades", uid, "accounts");
            const querySnapshot = await getDocs(accountsCollection);
            const accountsData = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return { id: doc.id, name: typeof data.name === 'string' ? data.name : 'Unnamed Account' };
            });
            setAccounts(accountsData);
            const lastAccount = localStorage.getItem("selectedAccount");
            setSelectedAccount(lastAccount ? lastAccount : accountsData[0]?.id); 
        } catch (error) {
            console.error("Error fetching accounts:", error);
        }
    };
    
    
    async function checkAndCreateAccount(db: Firestore) {
        try {
            // Reference the accounts collection
            const accountsRef = collection(db, "accounts");
            
            // Get the existing accounts
            const querySnapshot = await getDocs(accountsRef);
            
            // Check if any accounts exist
            if (querySnapshot.empty) {
                // No accounts exist, create a new one
                await addDoc(accountsRef, {
                    // Replace with your account data structure
                    name: "Default Account",
                    balance: 0,
                    createdAt: new Date(),
                });
                console.log("No accounts found. Created a new account.");
            } else {
                // Accounts exist, process them as needed
                querySnapshot.forEach((doc) => {
                    console.log(doc.id, " => ", doc.data());
                });
            }
        } catch (error) {
            console.error("Error checking or creating accounts: ", error);
        }
    }
    

    const handleAccountSelect = (accountId: string) => {
        setSelectedAccount(accountId);
        localStorage.setItem("selectedAccount", accountId); // Store selected account in local storage
        // Add logic here to update the trade path based on the selected account
    };


    const handleSubmitAccount = async () => {
        if (!userId) return;
    
        const newAccount = {
            userId,
            name: newAccountName,
            startingBalance,
            notes,
        };
    
        try {
            const accountsCollection = collection(db, "trades", userId, "accounts"); // Adjusted path
            await addDoc(accountsCollection, newAccount);
            fetchAccounts(userId); 
            setShowModal(false); 
            setNewAccountName(""); 
            setStartingBalance(0);
            setNotes("");
        } catch (error) {
            console.error("Error submitting account:", error);
        }
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
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                await checkAndCreateTradesCollection(user.uid); // Check and create trades collection
                fetchAccounts(user.uid); // Fetch accounts for the user
            } else {
                setUserId(null);
                setTrades([]);
                setAccounts([]);
            }
        });
    
        return () => unsubscribe();
    }, [auth]);
    
    const checkAndCreateTradesCollection = async (uid: string) => {
        if (!selectedAccount) {
            console.error("No account selected.");
            return; // Exit if selectedAccount is null
        }
    
        const tradesCollection = collection(db, "trades", uid, selectedAccount, "trades");
        const querySnapshot = await getDocs(tradesCollection); // Use tradesCollection here
    
        // If the collection doesn't exist, create it
        if (querySnapshot.empty) {
            const accountId = "Account1"; // Change this if you want to set a different default account ID
            const accountDocRef = doc(db, "trades", uid, accountId, "info");
            
            await setDoc(accountDocRef, {
                userId: uid,
                name: accountId,
                startingBalance: 0,
                notes: "Default Account",
            });
    
            console.log("Default account created for user:", uid);
        }
    };
    
    
    

    const fetchTrades = async (uid: string) => {
        try {
            const accountsCollection = collection(db, "accounts");
            const q = query(accountsCollection, where("userId", "==", uid), where('info', '!=', null));
            const querySnapshot = await getDocs(q);
            const tradesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTrades(tradesData);
        } catch (error) {
            console.error("Error fetching trades:", error);
        }
    };

    const handleSubmitTrade = async () => {
        if (!userId || !selectedAccount) {
            console.error("User ID or selected account is missing.");
            return;  // Exit if either is missing
        }
    
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
            startDate, // Use state variable
            endDate,   // Use state variable
        };
    
        try {
            // Ensure valid collection reference
            const tradesCollection = collection(db, "trades", userId, selectedAccount, "trades");
            await addDoc(tradesCollection, newTrade); // Add trade to the selected account's trades collection
            fetchTrades(userId); // Refresh trades after submission
        } catch (error) {
            console.error("Error submitting trade:", error);
        }
        console.log("User ID:", userId);
        console.log("Selected Account:", selectedAccount);
    };
    
    
    

    useEffect(() => {
        // Calculate potential profit based on trade type
        if (entryPrice && takeProfit) {
            if (selectedTradeType === 'long') {
                setPotentialProfit((takeProfit - entryPrice) * shares);
            } else if (selectedTradeType === 'short') {
                setPotentialProfit((entryPrice - takeProfit) * shares);
            }
        } else {
            setPotentialProfit(0);
        }
    
        // Calculate actual profit based on trade type
        if (entryPrice && exitPrice) {
            if (selectedTradeType === 'long') {
                setActualProfit((exitPrice - entryPrice) * shares);
            } else if (selectedTradeType === 'short') {
                setActualProfit((entryPrice - exitPrice) * shares);
            }
        } else {
            setActualProfit(0);
        }
    }, [entryPrice, takeProfit, exitPrice, shares, selectedTradeType]);
    
    


    return (
        <div className={styles.bg}>
            <div className={styles.header}>
                <HeaderMain className="top-0" />
            </div>
            <Dropdown>
                <DropdownTrigger>
                    <Button variant="bordered">
                        {selectedAccount ? accounts.find(acc => acc.id === selectedAccount)?.name || "Unnamed Account" : "Select Account"}
                    </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Select Account">
                    <>
                    {accounts.map(account => (
                        <DropdownItem key={account.id} onClick={() => handleAccountSelect(account.id)}>
                            {typeof account.name === 'string' ? account.name : 'Unnamed Account'}
                        </DropdownItem>
                    ))}
                    <DropdownItem key="new-account" onClick={() => setShowModal(true)}>
                        New Account
                    </DropdownItem>
                    </>
                </DropdownMenu>
            </Dropdown>
            <div className={styles.topContent}>
                <div className={styles.table}>
                    <Table aria-label="Trades table">
                        <TableHeader>
                            <TableColumn>Symbol</TableColumn>
                            <TableColumn>Type</TableColumn>
                            <TableColumn>Entry Price</TableColumn>
                            <TableColumn>Exit Price</TableColumn>
                            <TableColumn>Profit</TableColumn>
                            <TableColumn>Duration</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {trades.map((trade) => (
                                <TableRow key={trade.id}>
                                    <TableCell>{trade.symbol}</TableCell>
                                    <TableCell>{trade.type}</TableCell>
                                    <TableCell>${trade.entryPrice}</TableCell>
                                    <TableCell>${trade.exitPrice}</TableCell>
                                    <TableCell>${trade.actualProfit}</TableCell>
                                    <TableCell>{trade.duration}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className={styles.tradeEntry}>
                    <div className={styles.selectGroup}>
                        <Select size="sm" label="Symbol (symbol names)" className="w-full" aria-label="Select symbol" onChange={(e) => setSelectedSymbol(e.target.value)}>
                            {symbols.map((symbol) => (
                            <SelectItem key={symbol.key} value={symbol.key}>
                                {symbol.label}
                            </SelectItem>
                        ))}
                    </Select>
                        <Select size="sm" label="Trade Type (long or short)" className="w-full" aria-label="Select trade type" onChange={(e) => setSelectedTradeType(e.target.value)}>
                            {tradeTypes.map((tradeType) => (
                                <SelectItem key={tradeType.key} value={tradeType.key}>
                                    {tradeType.label}
                                </SelectItem>
                            ))}
                    </Select>
                    <Input
                            type="number"
                            size='sm'
                            label="# of Shares"
                            placeholder="0"
                            labelPlacement="inside"
                            aria-label="# of Shares"
                            className="w-full"
                            value={shares !== null ? shares.toString() : '0'} // Convert to string
                            onChange={(e) => setShares(Number(e.target.value))} // Update shares state
                    />
                    </div>
                    <div className={styles.priceGroup}>
                        <Input
                            type="number"
                            label="Entry Price"
                            placeholder="0.00"
                            labelPlacement="inside"
                            aria-label="Entry price"
                            size='sm'
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
                            size='sm'
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
                            size='sm'
                            labelPlacement="inside"
                            aria-label="Stop Loss"
                            value={stopLoss !== null ? stopLoss.toString() : ''} // Convert to string for controlled input
                            onChange={(e) => setStopLoss(Number(e.target.value))} // Update stop loss state
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
                            size='sm'
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
                    <DateRangePicker 
                        hideTimeZone
                        size='sm' 
                        label="Trade duration" 
                        className="w-full" 
                        aria-label="Select trade duration"
                        defaultValue={{
                            start: parseAbsoluteToLocal(new Date(new Date().setSeconds(0)).toISOString()),
                            end: parseAbsoluteToLocal(new Date(new Date().setSeconds(0)).toISOString()),
                        }}
                        onChange={(value: any) => {
                            setStartDate(value?.start ? value.start.toDate() : null);
                            setEndDate(value?.end ? value.end.toDate() : null);
                        }}
                    />

                    
                    </div>
                    <Divider orientation="horizontal" />
                    <div className={styles.statsGroup}>
                        <Input
                            isReadOnly
                            type="number"
                            label="Risk"
                            placeholder="0.00"
                            size='sm'
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
                            value={potentialProfit.toFixed(2)} // Display calculated value
                            labelPlacement="inside"
                            aria-label="Potential Profit"
                            variant='flat'
                            size='sm'
                            color={potentialProfit >= 0 ? 'success' : 'danger'}
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
                            value={actualProfit.toFixed(2)} // Display calculated value
                            labelPlacement="inside"
                            aria-label="Actual Profit"
                            size='sm'
                            variant='flat'
                            color={actualProfit >= 0 ? 'success' : 'danger'}
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

            <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
                <ModalHeader>Create New Account</ModalHeader>
                <ModalBody>
                    <Input
                        label="Account Name"
                        value={newAccountName}
                        onChange={(e) => setNewAccountName(e.target.value)}
                    />
                    <Input
                    type="number"
                    size="sm"
                    label="Starting Balance"
                    placeholder="0"
                    value={startingBalance !== null ? startingBalance.toString() : '0'} // Convert to string
                    onChange={(e) => setStartingBalance(Number(e.target.value))}
                    />
                    <Textarea
                        label="Notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </ModalBody>
                <ModalFooter>
                    <Button onClick={handleSubmitAccount}>Submit</Button>
                    <Button onClick={() => setShowModal(false)}>Cancel</Button>
                </ModalFooter>
            </Modal>


        </div>

    
    );
};

export default Trades;
