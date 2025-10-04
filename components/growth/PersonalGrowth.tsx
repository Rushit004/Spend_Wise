import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { User, Role } from '../../types';
import { Link } from 'react-router-dom';
import { Users as UsersIcon, Mail, Search, Briefcase } from 'lucide-react';

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

const ProfileAvatar: React.FC<{ user: User, size: string }> = ({ user, size }) => {
    if (user.profilePhotoUrl) {
        return <img src={user.profilePhotoUrl} alt={user.name} className={`${size} rounded-full object-cover`} />;
    }
    const initial = user.name.charAt(0).toUpperCase();
    const colors = ['bg-red-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-blue-500'];
    const colorIndex = (user.name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    
    return (
        <div className={`${size} rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold ${colors[colorIndex]}`}>
            {initial}
        </div>
    );
};

const CompanyProfile: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { getAllUsersInCompany, getUserById } = useData();

    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<Role | 'All'>('All');

    if (!currentUser) return null;

    const companyUsers = getAllUsersInCompany(currentUser.companyId);

    const filteredUsers = useMemo(() => {
        return companyUsers.filter(user => {
            const lowerSearchTerm = searchTerm.toLowerCase();
            const matchesSearch = searchTerm === '' ||
                user.name.toLowerCase().includes(lowerSearchTerm) ||
                user.email.toLowerCase().includes(lowerSearchTerm);

            const matchesRole = roleFilter === 'All' || user.role === roleFilter;

            return matchesSearch && matchesRole;
        });
    }, [companyUsers, searchTerm, roleFilter]);
    
    const roleCounts = useMemo(() => {
        return companyUsers.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
        }, {} as Record<Role, number>);
    }, [companyUsers]);

    const inputStyle = "w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white";

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Company Profile</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-5 mb-8 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Employees" value={companyUsers.length} icon={<UsersIcon className="w-6 h-6 text-blue-600"/>} />
                {Object.entries(roleCounts).map(([role, count]) => (
                    <StatCard key={role} title={`${role}s`} value={count} icon={<Briefcase className="w-6 h-6 text-green-600"/>} />
                ))}
            </div>

            {/* Filters */}
            <div className="p-4 my-6 space-y-4 bg-gray-100 rounded-lg dark:bg-gray-800">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="relative">
                        <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`${inputStyle} pl-10`} />
                        <Search className="absolute w-5 h-5 text-gray-400 left-3 top-2.5" />
                    </div>
                     <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as Role | 'All')} className={inputStyle}>
                        <option value="All">All Roles</option>
                        {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
            </div>

            {/* Employee List */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredUsers.map(user => {
                    const manager = user.managerId ? getUserById(user.managerId) : null;
                    return (
                        <Link to={`/profile/${user.id}`} key={user.id} className="block p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 hover:shadow-lg hover:scale-105 transition-transform duration-200">
                           <div className="flex items-center mb-4">
                               <ProfileAvatar user={user} size="w-16 h-16 text-2xl" />
                               <div className="ml-4">
                                   <p className="text-lg font-bold text-gray-900 dark:text-white">{user.name}</p>
                                   <p className="text-sm px-2 py-0.5 inline-block bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900 dark:text-blue-200">{user.role}</p>
                               </div>
                           </div>
                           <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                               <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400"/> {user.email}</p>
                               {manager && <p className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-gray-400"/> Reports to {manager.name}</p>}
                           </div>
                        </Link>
                    );
                })}
            </div>
             {filteredUsers.length === 0 && (
                <div className="p-6 text-center bg-white rounded-lg shadow-md dark:bg-gray-800">
                    <p className="text-gray-500 dark:text-gray-400">No users match the current filters.</p>
                </div>
            )}
        </div>
    );
};

export default CompanyProfile;