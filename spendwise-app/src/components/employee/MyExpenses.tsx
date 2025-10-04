
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Expense, ExpenseStatus } from '../../types';
import { Link } from 'react-router-dom';
import { PlusCircle, ChevronDown, ChevronUp, Sigma, Clock, CheckCircle } from 'lucide-react';
import { convertCurrency } from '../../services/currencyService';

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

const ExpenseListItem: React.FC<{ expense: Expense; isExpanded: boolean; onToggle: () => void; }> = ({ expense, isExpanded, onToggle }) => {
    const { getUserById } = useData();
    const approverNames = expense.currentApproverIds
        .map(id => getUserById(id)?.name)
        .filter(Boolean)
        .join(', ');

    return (
        <>
            <tr onClick={onToggle} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-300">{expense.date}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white">{expense.description}</td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-300">{expense.category}</td>
                <td className="px-6 py-4 text-sm font-medium text-right text-gray-900 whitespace-nowrap dark:text-white">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: expense.currency }).format(expense.amount)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-300">
                    <StatusBadge status={expense.status} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-300">
                   <div className="flex items-center justify-between">
                     <span>{expense.status === ExpenseStatus.Pending && approverNames ? `Pending: ${approverNames}` : '-'}</span>
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
                            <p className="mt-2 text-sm text-gray-500">No approval actions have been taken yet.</p>
                        )}
                    </td>
                </tr>
            )}
        </>
    );
};

const MyExpenses: React.FC = () => {
    const { user } = useAuth();
    const { getExpensesForUser, getCompanyById } = useData();
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [summary, setSummary] = useState({ approvedAmount: 0, isLoading: true });

    if (!user) return null;

    const expenses = getExpensesForUser(user.id);
    const company = getCompanyById(user.companyId);
    const baseCurrency = company?.baseCurrency || 'USD';

    const summaryCounts = useMemo(() => {
        return {
            total: expenses.length,
            pending: expenses.filter(e => e.status === ExpenseStatus.Pending).length,
            approved: expenses.filter(e => e.status === ExpenseStatus.Approved).length,
        };
    }, [expenses]);

    useEffect(() => {
        let isMounted = true;
        const calculateApprovedSum = async () => {
            setSummary({ approvedAmount: 0, isLoading: true });
            const approvedExpenses = expenses.filter(e => e.status === ExpenseStatus.Approved);

            const amounts = await Promise.all(
                approvedExpenses.map(expense => {
                    if (expense.currency === baseCurrency) {
                        return Promise.resolve(expense.amount);
                    }
                    return convertCurrency(expense.amount, expense.currency, baseCurrency);
                })
            );

            const total = amounts.reduce((sum, amount) => sum + (amount || 0), 0);

            if (isMounted) {
                setSummary({ approvedAmount: total, isLoading: false });
            }
        };

        if (expenses.length > 0 && company) {
            calculateApprovedSum();
        } else {
            setSummary({ approvedAmount: 0, isLoading: false });
        }
        
        return () => { isMounted = false; };
    }, [expenses, baseCurrency, company]);

    const handleToggle = (expenseId: string) => {
        setExpandedId(expandedId === expenseId ? null : expenseId);
    };

    return (
        <div>
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Expenses</h1>
                <Link to="/new-expense" className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">
                    <PlusCircle className="w-5 h-5 mr-2 -ml-1" />
                    New Expense
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 my-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Submitted" value={summaryCounts.total} icon={<Sigma className="w-6 h-6 text-gray-600" />} />
                <StatCard title="Pending Expenses" value={summaryCounts.pending} icon={<Clock className="w-6 h-6 text-yellow-600" />} />
                <StatCard title="Approved Expenses" value={summaryCounts.approved} icon={<CheckCircle className="w-6 h-6 text-green-600" />} />
                <StatCard 
                    title={`Total Approved (${baseCurrency})`} 
                    value={summary.isLoading ? '...' : new Intl.NumberFormat('en-US', { style: 'currency', currency: baseCurrency }).format(summary.approvedAmount)}
                    icon={<CheckCircle className="w-6 h-6 text-green-600" />} 
                />
            </div>
            
            <div className="mt-6 overflow-hidden border border-gray-200 rounded-lg shadow-md dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Date</th>
                                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Description</th>
                                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Category</th>
                                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase dark:text-gray-300">Amount</th>
                                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Status</th>
                                <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {expenses.length > 0 ? (
                                expenses.map(expense => 
                                    <ExpenseListItem 
                                        key={expense.id} 
                                        expense={expense} 
                                        isExpanded={expandedId === expense.id}
                                        onToggle={() => handleToggle(expense.id)}
                                    />)
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-sm text-center text-gray-500 whitespace-nowrap">
                                        You have not submitted any expenses yet.
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

export default MyExpenses;
