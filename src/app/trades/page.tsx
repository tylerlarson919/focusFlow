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
    Textarea,
    ScrollShadow
} from "@nextui-org/react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from '../../../firebase'; 
import { Firestore, collection, getDocs, query, where, addDoc, setDoc, doc, deleteDoc, updateDoc } from "firebase/firestore"; 
import { cp } from 'fs';
import {parseZonedDateTime, parseAbsoluteToLocal} from "@internationalized/date";
import { FaEllipsisVertical } from "react-icons/fa6";
import { LuTrash } from "react-icons/lu";
import { MdEdit } from "react-icons/md";
import App from './App'; // Import your App component



interface DropdownItemType {
    key: string;
    label: string;
    onClick: () => void;
    icon?: React.ReactNode; 
}



const Trades: React.FC = () => {
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);  
    const [selectedSymbol, setSelectedSymbol] = useState<string>("");
    const [selectedTradeType, setSelectedTradeType] = useState<string>("");
    const [entryPrice, setEntryPrice] = useState<number>(0);
    const [exitPrice, setExitPrice] = useState<number>(0);
    const [stopLoss, setStopLoss] = useState<number>(0);
    const [takeProfit, setTakeProfit] = useState<number>(0);
    const [shares, setShares] = useState<number>(0);
    const [risk, setRisk] = useState<number>(0);
    const [potentialProfit, setPotentialProfit] = useState<number>(0);
    const [potentialLoss, setPotentialLoss] = useState<number>(0);
    const [accountBalance, setAccountBalance] = useState<number>(0);
    const [actualProfit, setActualProfit] = useState<number>(0);
    const [userId, setUserId] = useState<string | null>(null);
    const [trades, setTrades] = useState<any[]>([]); 
    const auth = getAuth();
    const [accounts, setAccounts] = useState<any[]>([]); 
    const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [showTradeModal, setShowTradeModal] = useState<boolean>(false);
    const [newAccountName, setNewAccountName] = useState<string>("");
    const [newTradeName, setNewTradeName] = useState<string>("");
    const [accountToEdit, setAccountToEdit] = useState<any | null>(null);
    const [tradeToEdit, setTradeToEdit] = useState<any | null>(null);
    const [startingBalance, setStartingBalance] = useState<number>(0);
    const [notes, setNotes] = useState<string>("");
    const [value, setValue] = useState<string | undefined>("**Hello world!!!**");
    const markdownText = `# Hello, World!\n\nJust a link: [NASA](https://www.nasa.gov).`; // Define your markdown text

    const chartData = () => {
        return {
            accountBalance, 
            startingBalance,
            trades: sortedTrades.map(trade => ({
                symbol: trade.symbol,
                entryPrice: trade.entryPrice,
                exitPrice: trade.exitPrice,
                stopLoss: trade.stopLoss,
                takeProfit: trade.takeProfit,
                type: trade.type,
                duration: trade.duration,
                profitLoss: trade.actualProfit,
                potentialProfit: trade.potentialProfit,
                startDate: trade.startDate,
                risk: trade.risk,
            })) || []
        };
    };

    const fetchAccounts = async (uid: string) => {
        if (!uid) {
            return;
        }
        try {
            const accountsCollection = collection(db, "trades", `"${uid}"`, "accounts"); 
            const querySnapshot = await getDocs(accountsCollection);
    
            if (querySnapshot.empty) {
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
                
                const initialAccount = accountsData.find(account => account.id === initialAccountId);
                if (initialAccount) {
                    setStartingBalance(initialAccount.startingBalance);
                }

                if (initialAccountId && userId) {
                    fetchTrades(userId); 
                }
            }
        } catch (error) {
            console.error("Error fetching accounts:", error);
        }
    };
    useEffect(() => {
        if (selectedAccount && userId) {
            fetchTrades(userId);
            const selectedAccountData = accounts.find(account => account.id === selectedAccount);
            if (selectedAccountData) {
                setStartingBalance(selectedAccountData.startingBalance);
            }
        }
    }, [selectedAccount, userId, accounts]);

    const handleAccountSwitch = (accountId: string) => {
        setSelectedAccount(accountId);
        localStorage.setItem("selectedAccount", accountId);
    };

    useEffect(() => {
        calculateAccountBalance();
    }, [trades]);
    
    const dropdownItems: DropdownItemType[] = accounts.length > 0
    ? accounts.map(account => ({
        key: account.id,
        label: account.name,
        onClick: () => {
            setSelectedAccount(account.id);
            localStorage.setItem("selectedAccount", account.id);

            calculateAccountBalance(); 
            
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
    : [{ key: "no-accounts", label: "No Accounts", onClick: () => {} }];

    
    dropdownItems.push({
        key: "new-account",
        label: "New Account",
        onClick: () => setShowModal(true),
        icon: null 
    });

    const handleEditTrade = (trade: any) => {
        setTradeToEdit(trade); // Set the trade you want to edit
        setSelectedSymbol(trade.symbol); // Set the selected symbol to the trade's symbol
        setSelectedTradeType(trade.type); // Set the selected trade type to the trade's type
        setStartDate(trade.startDate); // Set the start date if needed
        setEndDate(trade.endDate); // Set the end date if needed
        setShowTradeModal(true); // Open the modal
    };

    const resetModalState = () => {
        setAccountToEdit(null); // Reset to null or initial state
        setNewAccountName(""); // Reset input field
        setStartingBalance(0); // Reset input field to initial value
        setNotes(""); // Reset input field
        setSelectedAccount(null); // Reset selected account if needed

        setNewTradeName("");
        setSelectedTradeType("");
        setSelectedSymbol("");
        setTradeToEdit(null);
        setStartDate(null);
        setEndDate(null);
        setTakeProfit(0);
        setStopLoss(0);
        setExitPrice(0);
        setEntryPrice(0);
        setShares(0);
    };

const handleDeleteAccount = async (id: string) => {
    if (!userId) {
        console.error("User ID is null. Cannot delete account.");
        return; 
    }
    

    const accountsCollection = collection(db, "trades", `"${userId}"`, "accounts");
    await deleteDoc(doc(accountsCollection, id));
    fetchAccounts(userId); 
    setShowModal(false);
    setSelectedAccount(null);
};


const handleDeleteTrade = async (id: string) => {
    if (!userId || !selectedAccount) {
        console.error("User ID or selected account is missing. Cannot delete trade.");
        return; 
    }

    try {
        const tradesCollection = collection(db, "trades", `"${userId}"`, "accounts", selectedAccount, "trades");
        await deleteDoc(doc(tradesCollection, id)); // Delete trade by ID
        fetchTrades(userId); // Refresh the trade list after deletion
        setShowTradeModal(false); // Close the modal
        setTradeToEdit(null); // Reset the selected trade
    } catch (error) {
        console.error("Error deleting trade:", error);
    }
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

    const handleUpdateTrade = async () => {
        if (!userId || !tradeToEdit || !selectedAccount) {
            console.error("User ID, trade to edit, or selected account is missing.");
            return;  
        }
    
        const isoStartDate = startDate ? new Date(startDate).toISOString() : null;
        const isoEndDate = endDate ? new Date(endDate).toISOString() : null;
    
        const calculateTradeDuration = (start: string | null, end: string | null): string | null => {
            if (!start || !end) return null; 
            
            const startDate = new Date(start);
            const endDate = new Date(end);
            const durationInMillis = endDate.getTime() - startDate.getTime(); 
            const hours = Math.floor((durationInMillis / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((durationInMillis / (1000 * 60)) % 60);
            
            if (hours === 0) {
                return `${minutes}m`; 
            } else {
                return `${hours}h ${minutes}m`; 
            }
        };
        
        const tradeDuration = calculateTradeDuration(startDate, endDate);
    
        const updatedTrade = {
            ...tradeToEdit,
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
            startDate: isoStartDate,
            endDate: isoEndDate,
            duration: tradeDuration,
        };
    
        try {
            const tradesCollection = collection(db, "trades", `"${userId}"`, "accounts", selectedAccount, "trades");
            await updateDoc(doc(tradesCollection, tradeToEdit.id), updatedTrade); // Update trade
            fetchTrades(userId); // Refresh the trade list after update
            setShowTradeModal(false); // Close the modal
            setTradeToEdit(null); // Reset the selected trade
        } catch (error) {
            console.error("Error updating trade:", error);
        }
    };
    

    const symbols = [
        { key: 'ESM', label: 'ESM' },
        { key: 'NQM', label: 'NQM' },
        { key: 'Other', label: 'Other' },
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
    
    const calculateAccountBalance = () => {
        if (!selectedAccount) return;

        const selectedAccountData = accounts.find(account => account.id === selectedAccount);
        if (!selectedAccountData) return;

        const startingBalance = selectedAccountData.startingBalance;
        const totalProfit = trades.reduce((acc, trade) => {
            return acc + (parseFloat(trade.actualProfit) || 0);
        }, 0);

        const currentBalance = Number(startingBalance) + Number(totalProfit);
        setAccountBalance(currentBalance);
    };
    
    
    useEffect(() => {
        // Calculate the account balance when trades are fetched
        if (trades.length > 0) {
            calculateAccountBalance();
        }
    }, [trades]); // This effect will run every time 'trades' updates
    
    const fetchTrades = async (uid: string) => {
        if (!selectedAccount) {
            console.error("No account selected.");
            return;
        }
        try {
            const tradesCollection = collection(db, "trades", `"${uid}"`, "accounts", selectedAccount, "trades");
            
            const querySnapshot = await getDocs(tradesCollection);
            const tradesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTrades(tradesData); // This will trigger the useEffect for trades
        } catch (error) {
            console.error("Error fetching trades:", error);
        }
    };

    const handleSubmitTrade = async () => {
        if (!userId || !selectedAccount) {
            console.error("User ID or selected account is missing.");
            return;  
        }
    
        const isoStartDate = startDate ? new Date(startDate).toISOString() : null;
        const isoEndDate = endDate ? new Date(endDate).toISOString() : null; 
    
        const calculateTradeDuration = (start: string | null, end: string | null): string | null => {
            if (!start || !end) return null; 
        
            const startDate = new Date(start);
            const endDate = new Date(end);
            const durationInMillis = endDate.getTime() - startDate.getTime(); 
            const hours = Math.floor((durationInMillis / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((durationInMillis / (1000 * 60)) % 60);
        
            if (hours === 0) {
                return `${minutes}m`; 
            } else {
                return `${hours}h ${minutes}m`; 
            }
        };
        
        const tradeDuration = calculateTradeDuration(startDate, endDate);
    
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
            startDate: isoStartDate,
            endDate: isoEndDate,
            duration: tradeDuration,
        };
    
        try {
            const tradesCollection = collection(db, "trades", `"${userId}"`, "accounts", selectedAccount, "trades");
            await addDoc(tradesCollection, newTrade); 
            setShowTradeModal(false);
            fetchTrades(userId); 
        } catch (error) {
            console.error("Error submitting trade:", error);
        }
    };
    useEffect(() => {
        if (selectedAccount) {
            const selectedAccountData = accounts.find(account => account.id === selectedAccount);
            if (selectedAccountData) {
                setStartingBalance(selectedAccountData.startingBalance);
            }
            calculateAccountBalance();
        }
    }, [selectedAccount, accounts]);
    
    
    useEffect(() => {
        if (entryPrice && takeProfit && shares) {
            const multiplier = symbols.some(symbol => symbol.key === selectedSymbol) ? 50 : 1;
    
            if (selectedTradeType === 'long') {
                setPotentialProfit((takeProfit - entryPrice) * shares * multiplier);
            } else if (selectedTradeType === 'short') {
                setPotentialProfit((entryPrice - takeProfit) * shares * multiplier);
            }
        } else {
            setPotentialProfit(0);
        }
    
        if (entryPrice && exitPrice) {
            const multiplier = symbols.some(symbol => symbol.key === selectedSymbol) ? 50 : 1;
    
            if (selectedTradeType === 'long') {
                setActualProfit((exitPrice - entryPrice) * shares * multiplier);
            } else if (selectedTradeType === 'short') {
                setActualProfit((entryPrice - exitPrice) * shares * multiplier);
            }
        } else {
            setActualProfit(0);
        }
    }, [entryPrice, takeProfit, exitPrice, shares, selectedTradeType, selectedSymbol]);
    
    useEffect(() => {
        if (tradeToEdit) {
            setShares(tradeToEdit.shares);
            setEntryPrice(tradeToEdit.entryPrice);
            setExitPrice(tradeToEdit.exitPrice);
            setStopLoss(tradeToEdit.stopLoss);
            setTakeProfit(tradeToEdit.takeProfit);
            setSelectedTradeType(tradeToEdit.type);
            setSelectedSymbol(tradeToEdit.symbol);
        }
    }, [tradeToEdit]);


    useEffect(() => {
        if (entryPrice && stopLoss) {
            const multiplier = symbols.some(symbol => symbol.key === selectedSymbol) ? 50 : 1;
            
            // Determine if the trade is long or short
            const isLong = selectedTradeType === 'long'; // Assuming 'tradeType' defines if it's long or short
            
            // Calculate potential loss based on entry price, stop loss, and trade direction
            const potentialLoss = isLong 
                ? (entryPrice - stopLoss) * shares * multiplier // Long trade calculation
                : (stopLoss - entryPrice) * shares * multiplier; // Short trade calculation
            
            setPotentialLoss(potentialLoss); // Set the potential loss
    
            // Ensure account balance is valid and calculate the risk
            if (potentialLoss && accountBalance) {
                const riskPercentage = (Math.abs(potentialLoss) / accountBalance) * 100; // Risk as percentage of account balance
                setRisk(riskPercentage);
            } else {
                setRisk(0); 
            }
        } else {
            setPotentialLoss(0); // Reset potential loss if entry price or stop loss is not available
            setRisk(0); // Reset risk as well
        }
    }, [entryPrice, stopLoss, shares, accountBalance, selectedSymbol, selectedTradeType]);
    
    
    
    const convertToISO = (customDate: any): string => {
        if (!customDate) return ""; 
    
        const { year, month, day, hour, minute, second } = customDate;
    
        const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    
        return date.toISOString(); 
    };
    
    const sortedTrades = trades.sort((a, b) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0; // Default to 0 if undefined
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0; // Default to 0 if undefined
        return dateA - dateB; // Sort in descending order
    });
    


    return (
        <div className={styles.bg}>
            <div className={styles.header}>
                <HeaderMain className="top-0" />
            </div>
            <div className={styles.dropdown}>
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
                <Button color="secondary" variant="faded" onClick={() => setShowTradeModal(true)} aria-label="Submit trade">
                    New Trade
                </Button>
            </div>
            <div className={styles.topContent}>
                <div className={styles.table}>
                    <Table color="secondary" selectionMode="single"  aria-label="Trades table" onRowAction={(trade) => setTradeToEdit(trade)}>
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
                            {sortedTrades.map((trade) => (
                                <TableRow key={trade.id}>
                                    <TableCell className="flex flex-row gap-3">
                                                <LuTrash  
                                                    className="cursor-pointer" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteTrade(trade.id); 
                                                    }} 
                                                />
                                                <MdEdit 
                                                    className="cursor-pointer" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditTrade(trade); 
                                                    }} 
                                                />
                                    </TableCell>
                                    <TableCell>{trade.symbol}</TableCell>
                                    <TableCell>{trade.type}</TableCell>
                                    <TableCell>${trade.entryPrice}</TableCell>
                                    <TableCell>${trade.exitPrice}</TableCell>
                                    <TableCell
                                        className={`${
                                            trade.actualProfit >= 0 ? 'text-green-500' : 'text-red-500'
                                        }`}
                                    >
                                        {trade.actualProfit < 0
                                            ? `-$${Math.abs(trade.actualProfit)}`
                                            : `$${trade.actualProfit}`}
                                    </TableCell>
                                    <TableCell>{trade.duration}</TableCell>

                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
            <div className={styles.bottomContent}>
                <StatsChart data={chartData()} />
            </div>

            <Modal isDismissable={false} placement='center' isOpen={showModal} onOpenChange={(isOpen) => {
                setShowModal(isOpen);
                if (!isOpen) {
                    resetModalState(); // Reset state when modal is closed
                }
            }}>
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
            {accountToEdit && (
                <Button color="default" onClick={() => handleDeleteAccount(accountToEdit.id)}>
                    Delete Account
                </Button>
            )}
            <Button color="secondary" onClick={accountToEdit ? handleUpdateAccount : handleSubmitAccount}>
                {accountToEdit ? "Update Account" : "Create Account"}
            </Button>

        </ModalFooter>
    </ModalContent>
</Modal>


<Modal isDismissable={false} placement='center' className="h-5/6 w-5/6" size="4xl" isOpen={showTradeModal} onOpenChange={(isOpen) => {
                setShowTradeModal(isOpen);
                if (!isOpen) {
                    resetModalState();
                    setTradeToEdit(null);
                }
            }}>
    <ModalContent>
        <ModalHeader>{tradeToEdit ? "Edit Trade" : "New Trade"}</ModalHeader>
            <ScrollShadow className="w-full h-full">
                <ModalBody>
                    {/* Trade Entry Form */}
                    <div className={styles.tradeEntry}>
                        <div className={styles.selectGroup}>
                        <Select 
                            size="sm" 
                            label="Symbol" 
                            className="w-full" 
                            aria-label="Select symbol" 
                            defaultSelectedKeys={[tradeToEdit?.symbol ? tradeToEdit.symbol.replace(/"/g, '') : selectedSymbol]} // Wrap the value in an array
                            onChange={(e) => {
                                const value = e.target.value;
                                setSelectedSymbol(value);
                                if (tradeToEdit) {
                                    tradeToEdit.symbol = value; // Update tradeToEdit symbol
                                }
                            }}
                            >
                            {symbols.map((symbol) => (
                                <SelectItem key={symbol.key} value={symbol.key}>
                                    {symbol.label}
                                </SelectItem>
                            ))}
                            </Select>

                            <Select 
                            size="sm" 
                            label="Type" 
                            className="w-full" 
                            aria-label="Select trade type" 
                            defaultSelectedKeys={[tradeToEdit?.type ? tradeToEdit.type.replace(/"/g, '') : selectedTradeType]} // Wrap the value in an array
                            onChange={(e) => {
                                const value = e.target.value;
                                setSelectedTradeType(value);
                                if (tradeToEdit) {
                                    tradeToEdit.type = value; // Update tradeToEdit type
                                }
                            }}
                            >
                            {tradeTypes.map((tradeType) => (
                                <SelectItem key={tradeType.key} value={tradeType.key}>
                                    {tradeType.label}
                                </SelectItem>
                            ))}
                            </Select>



                            <Input
                                type="number"
                                size="sm"
                                label="# of Shares"
                                placeholder="0"
                                aria-label="# of Shares"
                                className="w-full"
                                value={tradeToEdit && tradeToEdit.shares !== undefined ? tradeToEdit.shares.toString() : (shares !== null && shares !== undefined ? shares.toString() : '0')}
                                onChange={(e) => setShares(Number(e.target.value))}
                            />
                        </div>

                        <div className={styles.priceGroup}>
                            <Input
                                type="number"
                                label="Entry Price"
                                placeholder="0.00"
                                aria-label="Entry price"
                                size="sm"
                                value={tradeToEdit && tradeToEdit.entryPrice !== undefined ? tradeToEdit.entryPrice.toString() : (entryPrice !== null && entryPrice !== undefined ? entryPrice.toString() : '')}
                                onChange={(e) => setEntryPrice(Number(e.target.value))}
                                endContent={<span className="text-default-400 text-small">$</span>}
                            />
                            <Input
                                type="number"
                                label="Exit Price"
                                placeholder="0.00"
                                aria-label="Exit price"
                                size="sm"
                                value={tradeToEdit && tradeToEdit.exitPrice !== undefined ? tradeToEdit.exitPrice.toString() : (exitPrice !== null && exitPrice !== undefined ? exitPrice.toString() : '')}
                                onChange={(e) => setExitPrice(Number(e.target.value))}
                                endContent={<span className="text-default-400 text-small">$</span>}
                            />
                        </div>

                        <div className={styles.priceGroup}>
                            <Input
                                type="number"
                                label="Stop Loss"
                                placeholder="0.00"
                                size="sm"
                                aria-label="Stop Loss"
                                value={tradeToEdit && tradeToEdit.stopLoss !== undefined ? tradeToEdit.stopLoss.toString() : (stopLoss !== null && stopLoss !== undefined ? stopLoss.toString() : '')}
                                onChange={(e) => setStopLoss(Number(e.target.value))}
                                endContent={<span className="text-default-400 text-small">$</span>}
                            />
                            <Input
                                type="number"
                                label="Take Profit"
                                placeholder="0.00"
                                size="sm"
                                aria-label="Take Profit"
                                value={tradeToEdit && tradeToEdit.takeProfit !== undefined ? tradeToEdit.takeProfit.toString() : (takeProfit !== null && takeProfit !== undefined ? takeProfit.toString() : '')}
                                onChange={(e) => setTakeProfit(Number(e.target.value))}
                                endContent={<span className="text-default-400 text-small">$</span>}
                            />
                        </div>

                        <div className={styles.priceGroup}>
                        <DateRangePicker
                            hideTimeZone
                            size="sm"
                            label="Trade duration"
                            className="w-full"
                            aria-label="Select trade duration"
                            defaultValue={tradeToEdit && tradeToEdit.startDate && tradeToEdit.endDate ? {
                                start: parseAbsoluteToLocal(new Date(tradeToEdit.startDate).toISOString()),
                                end: parseAbsoluteToLocal(new Date(tradeToEdit.endDate).toISOString()),
                            } : {
                                start: parseAbsoluteToLocal(new Date(new Date().setSeconds(0)).toISOString()),
                                end: parseAbsoluteToLocal(new Date(new Date().setSeconds(0)).toISOString()),
                            }}
                            onChange={(value) => {
                                const isoStartDate = convertToISO(value?.start);
                                const isoEndDate = convertToISO(value?.end);
                                setStartDate(isoStartDate || null);
                                setEndDate(isoEndDate || null);
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
                                value={risk.toFixed(2)}
                                size="sm"
                                aria-label="Risk Percent"
                                endContent={<span className="text-default-400 text-small">%</span>}
                            />
                            <Input
                                isReadOnly
                                type="number"
                                label="Potential Loss"
                                value={potentialLoss.toFixed(2)}
                                aria-label="Potential Profit"
                                size="sm"
                                variant="flat"
                                color="danger"
                                startContent={<span className="text-default-400 text-small">$</span>}
                            />
                            <Input
                                isReadOnly
                                type="number"
                                label="Potential Profit"
                                value={potentialProfit.toFixed(2)}
                                aria-label="Potential Profit"
                                size="sm"
                                variant="flat"
                                color="success"
                                startContent={<span className="text-default-400 text-small">$</span>}
                            />
                            <Input
                                isReadOnly
                                type="number"
                                label="Actual Profit"
                                value={actualProfit.toFixed(2)}
                                aria-label="Actual Profit"
                                size="sm"
                                variant="flat"
                                color={actualProfit >= 0 ? 'success' : 'danger'}
                                startContent={<span className="text-default-400 text-small">$</span>}
                            />

                        </div>
                        <Divider orientation="horizontal" />
                        <div className='w-full min-h-max'>
                            <App initialContent={"Start Typing..."}/>
                        </div>
                    </div>
                </ModalBody>
            </ScrollShadow>
        <ModalFooter>
            {tradeToEdit && (
                <Button color="default" onClick={() => handleDeleteTrade(tradeToEdit.id)}>
                    Delete Trade
                </Button>
            )}
            <Button color="secondary" onClick={tradeToEdit ? handleUpdateTrade : handleSubmitTrade}>
                {tradeToEdit ? "Update Trade" : "Create Trade"}
            </Button>
        </ModalFooter>
    </ModalContent>
</Modal>


        </div>
    );
};

export default Trades;