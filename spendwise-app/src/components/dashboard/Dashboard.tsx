import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Role, ExpenseStatus } from '../../types';
import { Link } from 'react-router-dom';
import { PlusCircle, FileText, CheckSquare } from 'lucide-react';

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

const QuickLink: React.FC<{ to: string; title: string; icon: React.ReactNode; }> = ({ to, title, icon }) => (
    <Link to={to} className="flex flex-col items-center justify-center p-6 text-center bg-white rounded-lg shadow-md dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        {icon}
        <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-200">{title}</span>
    </Link>
);


const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const { getExpensesForUser, getPendingApprovalsForUser } = useData();

    if (!user) return null;
    
    const myExpenses = getExpensesForUser(user.id);
    const pendingExpenses = myExpenses.filter(e => e.status === ExpenseStatus.Pending).length;
    const approvedExpenses = myExpenses.filter(e => e.status === ExpenseStatus.Approved).length;

    const approverRoles = [Role.Manager, Role.Finance, Role.Director, Role.CFO, Role.Admin];
    let pendingApprovals = 0;
    if (approverRoles.includes(user.role)) {
        pendingApprovals = getPendingApprovalsForUser(user.id).length;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">Welcome back, {user.name}!</p>

            <div className="grid grid-cols-1 gap-6 mt-6 md:grid-cols-2 lg:grid-cols-3">
                <StatCard title="My Pending Expenses" value={pendingExpenses} icon={<FileText className="w-6 h-6 text-blue-600" />} />
                <StatCard title="My Approved Expenses" value={approvedExpenses} icon={<CheckSquare className="w-6 h-6 text-green-600" />} />
                {approverRoles.includes(user.role) && (
                    <StatCard title="Pending My Approval" value={pendingApprovals} icon={<CheckSquare className="w-6 h-6 text-orange-600" />} />
                )}
            </div>
            
            <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Quick Actions</h2>
                 <div className="grid grid-cols-2 gap-6 mt-4 md:grid-cols-4">
                    <QuickLink to="/new-expense" title="Submit New Expense" icon={<PlusCircle className="w-8 h-8 text-blue-500" />} />
                    <QuickLink to="/my-expenses" title="View My Expenses" icon={<FileText className="w-8 h-8 text-blue-500" />} />
                    {approverRoles.includes(user.role) && (
                         <QuickLink to="/approvals" title="Review Approvals" icon={<CheckSquare className="w-8 h-8 text-blue-500" />} />
                    )}
                </div>
            </div>
            
            <div className="p-4 mt-8 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg dark:bg-gray-800 dark:border-blue-400">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            This is a demo application. All data is stored in your browser's local storage and will be cleared if you clear your browser data. No information is sent to a server.
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Dashboard;