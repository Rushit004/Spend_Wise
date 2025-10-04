
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Expense, ExpenseStatus, User } from '../../types';
import { convertCurrency } from '../../services/currencyService';
import { Loader, Search, ChevronDown, ChevronUp, Sigma, Briefcase, Clock, CheckCircle } from 'lucide-react';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full dark:bg-blue-900">
                {icon}
            </div>
            <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
            </div>
        </div>
    </div>
);

const StatusBadge: React.FC<{ status: ExpenseStatus }> = ({ status }) => {
    const colorMap = {
        [ExpenseStatus.Pending]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        [ExpenseStatus.Approved]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        [ExpenseStatus.Rejected]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorMap[status]}`}>{status}</span>;
};

const ConvertedAmount: React.FC<{ expense: Expense; baseCurrency: string }> = ({ expense, baseCurrency }) => {
    const [convertedAmount, setConvertedAmount] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const originalAmountFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: expense.currency }).format(expense.amount);

    React.useEffect(() => {
        let isMounted = true;
        if (expense.currency !== baseCurrency) {
            setIsLoading(true);
            convertCurrency(expense.amount, expense.currency, baseCurrency)
                .then(converted => {
                    if (isMounted && converted !== null) {
                        setConvertedAmount(new Intl.NumberFormat('en-US', { style: 'currency', currency: baseCurrency }).format(converted));
                    }
                })
                .finally(() => {
                    if (isMounted) setIsLoading(false);
                });
        } else {
            setIsLoading(false);
        }
        return () => { isMounted = false; };
    }, [expense.amount, expense.currency, baseCurrency]);

    if (expense.currency === baseCurrency || isLoading) {
         return <>{originalAmountFormatted} {isLoading && expense.currency !== baseCurrency && <Loader className="inline-block w-4 h-4 ml-2 animate-spin" />}</>;
    }

    return (
        <>
            {originalAmountFormatted}
            {convertedAmount && <span className="block text-xs text-gray-500 dark:text-gray-400">({convertedAmount})</span>}
        </>
    );
};


const TeamExpenseListItem: React.FC<{ expense: Expense; baseCurrency: string; isExpanded: boolean; onToggle: () => void; }> = ({ expense, baseCurrency, isExpanded, onToggle }) => {
    const { getUserById } = useData();
    const employee = getUserById(expense.userId);

    return (
       <>
            <tr onClick={onToggle} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">{employee?.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-300">{expense.date}</td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-300">{expense.description}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    <ConvertedAmount expense={expense} baseCurrency={baseCurrency} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-300">
                    <StatusBadge status={expense.status} />
                </td>
                 <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-300">
                   <div className="flex items-center justify-end">
                     {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                   </div>
                </td>
            </tr>
            {isExpanded && (
                <tr className="bg-gray-50 dark:bg-gray-800">
                    <td colSpan={6} className="px-6 py-4">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Approval History</h4>
                        {expense.history.length > 0 ? (
                            <ul className="mt-2 space-y-2">
                                {expense.history.map((action, index) => (
                                    <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                                        <span className={`font-medium ${action.status === ExpenseStatus.Approved ? 'text-green-600' : 'text-red-600'}`}>
                                            {action.status}
                                        </span> by {action.approverName} on {new Date(action.date).toLocaleDateString()}.
                                        {action.comment && <p className="pl-4 italic">"{action.comment}"</p>}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="mt-2 text-sm text-gray-500">No approval actions have been taken on this expense yet.</p>
                        )}
                    </td>
                </tr>
            )}
        </>
    );
};


const TeamExpenses: React.FC = () => {
    const { user } = useAuth();
    const { getTeamExpenses, getCompanyById, getAllUsersInCompany, getUserById } = useData();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<ExpenseStatus | 'All'>('All');
    const [employeeFilter, setEmployeeFilter] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [summary, setSummary] = useState({ totalAmount: 0, isLoading: true });


    if (!user) return null;
    
    const company = getCompanyById(user.companyId);
    const baseCurrency = company?.baseCurrency || 'USD';
    const expenses = getTeamExpenses(user.id);
    const teamMembers = useMemo(() => 
        getAllUsersInCompany(user.companyId).filter(u => u.managerId === user.id),
        [getAllUsersInCompany, user.companyId, user.id]
    );

    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('All');
        setEmployeeFilter('All');
        setStartDate('');
        setEndDate('');
    };

    const handleToggle = (expenseId: string) => {
        setExpandedId(expandedId === expenseId ? null : expenseId);
    };

    const filteredExpenses = useMemo(() => {
        return expenses.filter(expense => {
            const employee = getUserById(expense.userId);
            const lowerSearchTerm = searchTerm.toLowerCase();

            const matchesSearch = searchTerm === '' ||
                expense.description.toLowerCase().includes(lowerSearchTerm) ||
                (employee && employee.name.toLowerCase().includes(lowerSearchTerm));

            const matchesStatus = statusFilter === 'All' || expense.status === statusFilter;
            const matchesEmployee = employeeFilter === 'All' || expense.userId === employeeFilter;
            
            const expenseDate = new Date(expense.date);
            const matchesStartDate = startDate === '' || expenseDate >= new Date(startDate);
            const matchesEndDate = endDate === '' || expenseDate <= new Date(endDate);

            return matchesSearch && matchesStatus && matchesEmployee && matchesStartDate && matchesEndDate;
        });
    }, [expenses, searchTerm, statusFilter, employeeFilter, startDate, endDate, getUserById]);

     const summaryCounts = useMemo(() => {
        return {
            total: filteredExpenses.length,
            pending: filteredExpenses.filter(e => e.status === ExpenseStatus.Pending).length,
            approved: filteredExpenses.filter(e => e.status === ExpenseStatus.Approved).length,
        };
    }, [filteredExpenses]);

    useEffect(() => {
        let isMounted = true;
        const calculateTotalSum = async () => {
            setSummary({ totalAmount: 0, isLoading: true });

            const amounts = await Promise.all(
                filteredExpenses.map(expense => {
                    if (expense.currency === baseCurrency) {
                        return Promise.resolve(expense.amount);
                    }
                    return convertCurrency(expense.amount, expense.currency, baseCurrency);
                })
            );

            const total = amounts.reduce((sum, amount) => sum + (amount || 0), 0);

            if (isMounted) {
                setSummary({ totalAmount: total, isLoading: false });
            }
        };

        if (filteredExpenses.length > 0 && company) {
            calculateTotalSum();
        } else {
            setSummary({ totalAmount: 0, isLoading: false });
        }
        
        return () => { isMounted = false; };
    }, [filteredExpenses, baseCurrency, company]);
    
    const inputStyle = "w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white";

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Expenses</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">View all expenses submitted by your team members.</p>
            
             <div className="grid grid-cols-1 gap-5 my-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title={`Total Amount (${baseCurrency})`} 
                    value={summary.isLoading ? '...' : new Intl.NumberFormat('en-US', { style: 'currency', currency: baseCurrency }).format(summary.totalAmount)}
                    icon={<Sigma className="w-6 h-6 text-blue-600" />} 
                />
                <StatCard title="Total Expenses" value={summaryCounts.total} icon={<Briefcase className="w-6 h-6 text-gray-600"/>} />
                <StatCard title="Pending" value={summaryCounts.pending} icon={<Clock className="w-6 h-6 text-yellow-600"/>} />
                <StatCard title="Approved" value={summaryCounts.approved} icon={<CheckCircle className="w-6 h-6 text-green-600"/>} />
            </div>

            <div className="p-4 my-6 space-y-4 bg-gray-100 rounded-lg dark:bg-gray-800">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="relative">
                        <input type="text" placeholder="Search by name or description..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`${inputStyle} pl-10`} />
                        <Search className="absolute w-5 h-5 text-gray-400 left-3 top-2.5" />
                    </div>
                     <select value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)} className={inputStyle}>
                        <option value="All">All Team Members</option>
                        {teamMembers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as ExpenseStatus | 'All')} className={inputStyle}>
                        <option value="All">All Statuses</option>
                        {Object.values(ExpenseStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputStyle} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputStyle} />
                    </div>
                    <div className="lg:col-start-4">
                      <button onClick={resetFilters} className="w-full px-4 py-2 font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500">
                          Reset Filters
                      </button>
                    </div>
                </div>
            </div>
            
            <div className="mt-6 overflow-hidden border border-gray-200 rounded-lg shadow-md dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Employee</th>
                                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Date</th>
                                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Description</th>
                                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Amount</th>
                                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Status</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Toggle Details</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredExpenses.length > 0 && company ? (
                                filteredExpenses.map(expense => 
                                    <TeamExpenseListItem 
                                        key={expense.id} 
                                        expense={expense} 
                                        baseCurrency={company.baseCurrency}
                                        isExpanded={expandedId === expense.id}
                                        onToggle={() => handleToggle(expense.id)}
                                    />)
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-sm text-center text-gray-500 whitespace-nowrap">
                                        No expenses match the current filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TeamExpenses;
