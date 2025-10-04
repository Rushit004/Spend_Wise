import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Company, Expense, User, Workflow, ExpenseStatus, Role, StepApproverType, StepCompletionType, ChatMessage } from '../types';
import { useAuth } from './AuthContext';

// --- DATA INITIALIZATION & HELPERS ---
const initialUsers: User[] = [];
const initialCompanies: Company[] = [];
const initialExpenses: Expense[] = [];
const initialWorkflows: Workflow[] = [];
const initialMessages: ChatMessage[] = [];


const getInitialData = <T,>(key: string, initialValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
    } catch (error) {
        console.error(`Error reading ${key} from localStorage`, error);
        return initialValue;
    }
};

const defaultWorkflow: Omit<Workflow, 'id' | 'companyId'> = {
    name: 'Default Company Workflow',
    isDefault: true,
    steps: [
        { 
            id: 'step1', 
            name: 'Manager Approval', 
            approvers: [{ id: crypto.randomUUID(), type: StepApproverType.DirectManager }],
            completionCondition: { type: StepCompletionType.All }
        },
        { 
            id: 'step2', 
            name: 'Finance / Senior Approval', 
            approvers: [], // To be configured by Admin
            completionCondition: { type: StepCompletionType.All }
        }
    ],
    stopConditions: [],
};


// --- CONTEXT DEFINITION ---
interface DataContextType {
    users: User[];
    companies: Company[];
    expenses: Expense[];
    workflows: Workflow[];
    messages: ChatMessage[];
    addUser: (user: Omit<User, 'id' | 'passwordHash'> & {passwordHash: string}) => User;
    updateUser: (user: User) => void;
    findUserByEmail: (email: string) => User | undefined;
    addCompany: (company: Omit<Company, 'id'>) => Company;
    addExpense: (expense: Omit<Expense, 'id'>) => Expense;
    updateExpense: (expense: Expense) => void;
    addMessage: (message: Omit<ChatMessage, 'id'>) => ChatMessage;
    getMessagesForChannel: (channelId: string) => ChatMessage[];
    getExpensesForUser: (userId: string) => Expense[];
    getPendingApprovalsForUser: (userId: string) => Expense[];
    getTeamExpenses: (managerId: string) => Expense[];
    getExpensesForCompany: (companyId: string) => Expense[];
    getAllUsersInCompany: (companyId: string) => User[];
    getWorkflowsForCompany: (companyId: string) => Workflow[];
    saveWorkflow: (workflow: Workflow) => void;
    getCompanyById: (companyId: string) => Company | undefined;
    getUserById: (userId: string) => User | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user: currentUser, setUser: setCurrentUser } = useAuth();
    const [users, setUsers] = useState<User[]>(() => getInitialData('proexpense_users', initialUsers));
    const [companies, setCompanies] = useState<Company[]>(() => getInitialData('proexpense_companies', initialCompanies));
    const [expenses, setExpenses] = useState<Expense[]>(() => getInitialData('proexpense_expenses', initialExpenses));
    const [workflows, setWorkflows] = useState<Workflow[]>(() => getInitialData('proexpense_workflows', initialWorkflows));
    const [messages, setMessages] = useState<ChatMessage[]>(() => getInitialData('proexpense_messages', initialMessages));
    
    useEffect(() => { localStorage.setItem('proexpense_users', JSON.stringify(users)); }, [users]);
    useEffect(() => { localStorage.setItem('proexpense_companies', JSON.stringify(companies)); }, [companies]);
    useEffect(() => { localStorage.setItem('proexpense_expenses', JSON.stringify(expenses)); }, [expenses]);
    useEffect(() => { localStorage.setItem('proexpense_workflows', JSON.stringify(workflows)); }, [workflows]);
    useEffect(() => { localStorage.setItem('proexpense_messages', JSON.stringify(messages)); }, [messages]);

    const addUser = (user: Omit<User, 'id' | 'passwordHash'> & {passwordHash: string}): User => {
        const newUser: User = { 
            ...user, 
            id: crypto.randomUUID(),
            phone: '',
            profilePhotoUrl: '',
            about: `Hi, I'm ${user.name}. I'm excited to be part of the team!`,
            address: '',
            workExperience: [],
            friendIds: [],
        };
        setUsers(prev => [...prev, newUser]);
        return newUser;
    };

    const updateUser = (updatedUser: User) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
         if (currentUser && updatedUser.id === currentUser.id) {
            setCurrentUser(updatedUser);
        }
    };

    const findUserByEmail = (email: string): User | undefined => {
        return users.find(u => u.email === email);
    };

    const addCompany = (company: Omit<Company, 'id'>): Company => {
        const newCompany = { ...company, id: crypto.randomUUID() };
        setCompanies(prev => [...prev, newCompany]);
        // Create default workflow for the new company
        const newWorkflow = { ...defaultWorkflow, id: crypto.randomUUID(), companyId: newCompany.id };
        setWorkflows(prev => [...prev, newWorkflow]);
        return newCompany;
    };
    
    const addExpense = (expenseData: Omit<Expense, 'id'>): Expense => {
        const newExpense: Expense = { ...expenseData, id: crypto.randomUUID() };
        setExpenses(prev => [...prev, newExpense]);
        return newExpense;
    };

    const updateExpense = (updatedExpense: Expense) => {
        setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    };
    
    const addMessage = (messageData: Omit<ChatMessage, 'id'>): ChatMessage => {
        const newMessage: ChatMessage = { ...messageData, id: crypto.randomUUID() };
        setMessages(prev => [...prev, newMessage]);
        return newMessage;
    };

    const getMessagesForChannel = useCallback((channelId: string) => {
        return messages.filter(m => m.channelId === channelId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [messages]);

    const getExpensesForUser = useCallback((userId: string) => {
        return expenses.filter(e => e.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses]);
    
    const getPendingApprovalsForUser = useCallback((userId: string) => {
        return expenses.filter(e => e.status === ExpenseStatus.Pending && e.currentApproverIds.includes(userId)).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses]);

    const getTeamExpenses = useCallback((managerId: string) => {
        const teamMemberIds = users.filter(u => u.managerId === managerId).map(u => u.id);
        return expenses.filter(e => teamMemberIds.includes(e.userId)).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, users]);
    
    const getExpensesForCompany = useCallback((companyId: string) => {
        const companyUserIds = users.filter(u => u.companyId === companyId).map(u => u.id);
        return expenses.filter(e => companyUserIds.includes(e.userId)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, users]);

    const getAllUsersInCompany = useCallback((companyId: string) => {
      return users.filter(u => u.companyId === companyId);
    }, [users]);
    
    const getWorkflowsForCompany = useCallback((companyId: string) => {
      return workflows.filter(w => w.companyId === companyId);
    }, [workflows]);

    const saveWorkflow = (workflowToSave: Workflow) => {
        setWorkflows(prev => {
            // If making a workflow default, unset other defaults for the same company
            if (workflowToSave.isDefault) {
                prev.forEach(w => {
                    if (w.companyId === workflowToSave.companyId && w.id !== workflowToSave.id) {
                        w.isDefault = false;
                    }
                });
            }

            const exists = prev.some(w => w.id === workflowToSave.id);
            if (exists) {
                return prev.map(w => w.id === workflowToSave.id ? workflowToSave : w);
            }
            return [...prev, workflowToSave];
        });
    };

    const getCompanyById = useCallback((companyId: string) => {
        return companies.find(c => c.id === companyId);
    }, [companies]);

    const getUserById = useCallback((userId: string) => {
        return users.find(u => u.id === userId);
    }, [users]);


    return (
        <DataContext.Provider value={{
            users, companies, expenses, workflows, messages,
            addUser, updateUser, findUserByEmail,
            addCompany, addExpense, updateExpense, addMessage, getMessagesForChannel,
            getExpensesForUser, getPendingApprovalsForUser,
            getTeamExpenses, getExpensesForCompany, getAllUsersInCompany,
            getWorkflowsForCompany, saveWorkflow, getCompanyById,
            getUserById
        }}>
            {children}
        </DataContext.Provider>
    );
};

// --- HOOK ---
export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};