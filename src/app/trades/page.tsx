"use client";
import React, { useState, useEffect } from 'react';
import StatsChart from './statsCharts'
import styles from './page.module.css'; 
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
    ModalContent,
    ModalBody,
    ModalHeader,
    ModalFooter,
    Textarea 
} from "@nextui-org/react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from '../../../firebase'; 
import { Firestore, collection, getDocs, query, where, addDoc, setDoc, doc, deleteDoc } from "firebase/firestore"; 
import { cp } from 'fs';
import {parseZonedDateTime, parseAbsoluteToLocal} from "@internationalized/date";
import { FaEllipsisVertical } from "react-icons/fa6";
import { LuTrash } from "react-icons/lu";

interface DropdownItemType {
    key: string;
    label: string;
    onClick: () => void;
    icon?: React.ReactNode; 
}

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
    const [trades, setTrades] = useState<any[]>([]); 
    const [selectedTrade, setSelectedTrade] = useState<any>(null);
    const auth = getAuth();
    const [accounts, setAccounts] = useState<any[]>([]); 
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [newAccountName, setNewAccountName] = useState<string>("");
    const [accountToEdit, setAccountToEdit] = useState<any | null>(null);
    const [startingBalance, setStartingBalance] = useState<number>(0);
    const [notes, setNotes] = useState<string>("");

    const chartData = () => {
        return trades.map(trade => ({
            symbol: trade.symbol,
            entryPrice: trade.entryPrice,
            exitPrice: trade.exitPrice,
            type: trade.type,
            duration: trade.duration,
            profitLoss: trade.exitPrice - trade.entryPrice,
        })) || [];
    };

    const fetchAccounts = async (uid: string) => {
        if (!uid) {
            console.log("User ID is not defined");
            return;
        }
    
        try {
            const accountsCollection = collection(db, "trades", `"${uid}"`, "accounts"); 
            const querySnapshot = await getDocs(accountsCollection);
    
            if (querySnapshot.empty) {
                console.log("No accounts found for user:", uid);
            } else {
                const accountsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    name: typeof doc.data().name === 'string' ? doc.data().name : 'Unnamed Account',
                    startingBalance: doc.data().startingBalance || 0, 
                    notes: doc.data().description || "" 
                }));
    
                setAccounts(accountsData);
    
                const lastAccount = localStorage.getItem("selectedAccount");
                const initialAccountId = lastAccount ? lastAccount : accountsData[0]?.id;
                setSelectedAccount(initialAccountId);
                
                // Fetch trades for the initially selected account
                if (initialAccountId && userId) {
                    fetchTrades(userId); 
                }
            }
        } catch (error) {
            console.error("Error fetching accounts:", error);
        }
    };
    
    // Add this effect to fetch trades when selectedAccount changes
    useEffect(() => {
        if (selectedAccount && userId) {
            fetchTrades(userId);
        }
    }, [selectedAccount, userId]);
    
    const dropdownItems: DropdownItemType[] = accounts.length > 0 
    ? accounts.map(account => ({
        key: account.id,
        label: account.name,
        onClick: () => {
            setSelectedAccount(account.id);
            localStorage.setItem("selectedAccount", account.id);
            
            if (userId) {
                fetchTrades(userId); // Call only if userId is not null
            } else {
                console.error("User ID is null");
                // Handle the case where userId is null (e.g., show an alert)
            }
        },
        icon: (
            <FaEllipsisVertical 
                onClick={(e) => {
                    e.stopPropagation(); 
                    setAccountToEdit(account); 
                    setShowModal(true); 
                }} 
                className="ml-2 text-gray-500 cursor-pointer" 
            />
        )
    }))
    : [{ key: "no-accounts", label: "No Accounts", onClick: () => {} } as DropdownItemType];
    
    dropdownItems.push({
        key: "new-account",
        label: "New Account",
        onClick: () => setShowModal(true),
        icon: null 
    });

const handleDeleteAccount = async (id: string) => {
    if (!userId) {
        console.error("User ID is null. Cannot delete account.");
        return; 
    }
    

    const accountsCollection = collection(db, "trades", userId, "accounts");
    await deleteDoc(doc(accountsCollection, id));
    fetchAccounts(userId); 
    setShowModal(false);
};

const handleUpdateAccount = async () => {
    if (!userId || !accountToEdit) return;

    const updatedAccount = {
        userId,
        name: newAccountName,
        startingBalance,
        notes,
    };

    try {
        const accountsCollection = collection(db, "trades", userId, "accounts");
        await setDoc(doc(accountsCollection, accountToEdit.id), updatedAccount); 
        fetchAccounts(userId); 
        setShowModal(false); 
    } catch (error) {
        console.error("Error updating account:", error);
    }
};

    const handleSubmitAccount = async () => {
        if (!userId || !newAccountName) return; 
    
        const newAccount = {
            userId,
            name: newAccountName,
            startingBalance,
            notes,
        };
        try {
            const accountsCollection = collection(db, "trades", `"${userId}"`, "accounts"); 
            await addDoc(accountsCollection, newAccount);
            await fetchAccounts(userId); 
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
    ];
    const tradeTypes = [
        { key: 'long', label: 'Long' },
        { key: 'short', label: 'Short' },
    ];
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                await fetchAccounts(user.uid); // Wait for accounts to fetch
            } else {
                setUserId(null);
                setAccounts([]);
            }
        });
        return () => unsubscribe();
    }, [auth]);
    
    const fetchTrades = async (uid: string) => {
        if (!selectedAccount) {
            console.error("No account selected.");
            return;
        }
    
        try {
            const tradesCollection = collection(db, "trades", `"${uid}"`, "accounts", selectedAccount, "trades");
    
            console.log("Fetching trades from: ", tradesCollection);
            const querySnapshot = await getDocs(tradesCollection);
            const tradesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log("Trades fetched:", tradesData); 
            setTrades(tradesData);
        } catch (error) {
            console.error("Error fetching trades:", error);
        }
    };

    const handleSubmitTrade = async () => {
        if (!userId || !selectedAccount) {
            console.error("User ID or selected account is missing.");
            return;  
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
            startDate, 
            endDate,   
        };
    
        try {
            const tradesCollection = collection(db, "trades", `"${userId}"`, "accounts", selectedAccount, "trades");
            await addDoc(tradesCollection, newTrade); 
            fetchTrades(userId); 
        } catch (error) {
            console.error("Error submitting trade:", error);
        }
        console.log("User ID:", userId);
        console.log("Selected Account:", selectedAccount);
    };

    useEffect(() => {
        if (entryPrice && takeProfit) {
            if (selectedTradeType === 'long') {
                setPotentialProfit((takeProfit - entryPrice) * shares);
            } else if (selectedTradeType === 'short') {
                setPotentialProfit((entryPrice - takeProfit) * shares);
            }
        } else {
            setPotentialProfit(0);
        }
    
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

    const handleDeleteTrade = async (tradeId: string) => {
        if (!userId || !selectedAccount) {
            console.error("User ID or selected account is missing.");
            return;  
        }
    
        const tradesCollection = collection(db, "trades", `"${userId}"`, "accounts", selectedAccount, "trades");
        try {
            await deleteDoc(doc(tradesCollection, tradeId));
            fetchTrades(userId); 
        } catch (error) {
            console.error("Error deleting trade:", error);
        }
    };

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
                <DropdownMenu aria-label="Dynamic Actions" items={dropdownItems}>
                    {(item) => (
                        <DropdownItem
                            key={item.key}
                            color={item.key === "delete" ? "danger" : "default"}
                            className={item.key === "delete" ? "text-danger" : ""}
                            onClick={item.onClick} 
                            endContent={item.icon} 
                        >
                            {item.label}
                        </DropdownItem>
                    )}
                </DropdownMenu>
            </Dropdown>

            <div className={styles.topContent}>
                <div className={styles.table}>
                    <Table color="secondary" selectionMode="single"  aria-label="Trades table" onRowAction={(trade) => setSelectedTrade(trade)}>
                        <TableHeader>
                            <TableColumn>Actions</TableColumn>
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
                                    <TableCell>
                                        <LuTrash  
                                            className="cursor-pointer" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteTrade(trade.id); 
                                            }} 
                                        />
                                    </TableCell>
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
                            value={shares !== null ? shares.toString() : '0'} 
                            onChange={(e) => setShares(Number(e.target.value))} 
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
                            value={entryPrice !== null ? entryPrice.toString() : ''} 
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
                            value={exitPrice !== null ? exitPrice.toString() : ''} 
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
                            value={stopLoss !== null ? stopLoss.toString() : ''} 
                            onChange={(e) => setStopLoss(Number(e.target.value))} 
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
                            value={takeProfit !== null ? takeProfit.toString() : ''} 
                            onChange={(e) => setTakeProfit(Number(e.target.value))} 
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
                            value={potentialProfit.toFixed(2)} 
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
                            value={actualProfit.toFixed(2)} 
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

            <Modal isOpen={showModal} onOpenChange={setShowModal}>
                <ModalContent>
                    <ModalHeader>{accountToEdit ? "Edit Account" : "Create New Account"}</ModalHeader>
                    <ModalBody>
                        <Input
                            label="Account Name"
                            value={accountToEdit ? accountToEdit.name : newAccountName}
                            onChange={(e) => accountToEdit ? setAccountToEdit({...accountToEdit, name: e.target.value}) : setNewAccountName(e.target.value)}
                        />
                        <Input
                            label="Starting Balance"
                            type="number"
                            value={accountToEdit ? accountToEdit.startingBalance : startingBalance}
                            onChange={(e) => accountToEdit ? setAccountToEdit({...accountToEdit, startingBalance: Number(e.target.value)}) : setStartingBalance(Number(e.target.value))}
                        />
                        <Textarea
                            label="Notes"
                            value={accountToEdit ? accountToEdit.notes : notes}
                            onChange={(e) => accountToEdit ? setAccountToEdit({...accountToEdit, notes: e.target.value}) : setNotes(e.target.value)}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button onClick={accountToEdit ? handleUpdateAccount : handleSubmitAccount}>
                            {accountToEdit ? "Update Account" : "Create Account"}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
};
export default Trades;