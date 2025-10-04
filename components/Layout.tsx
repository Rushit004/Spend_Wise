import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';
import { Home, FileText, CheckSquare, Users, Settings, LogOut, Menu, X, Briefcase, Wallet, Building2, MessageSquare, User as UserIcon } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const iconProps = {
  className: "w-5 h-5 mr-3"
};

const NavItem: React.FC<{ to: string; icon: React.ReactNode; children: React.ReactNode; }> = ({ to, icon, children }) => (
    <NavLink
        to={to}
        end
        className={({ isActive }) =>
            `flex items-center px-4 py-2 my-1 text-sm font-medium rounded-md transition-colors duration-150 ${
            isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`
        }
    >
        {icon}
        {children}
    </NavLink>
);

const Sidebar: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    const approverRoles = [Role.Manager, Role.Finance, Role.Director, Role.CFO, Role.Admin];

    return (
        <div className={`flex flex-col h-full bg-white dark:bg-gray-800 border-r dark:border-gray-700 transition-all duration-300 ${isOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
            <div className="flex items-center justify-center h-16 border-b dark:border-gray-700">
                <Wallet className="w-8 h-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-800 dark:text-white">SpendWise</span>
            </div>
            <nav className="flex-grow p-4">
                <NavItem to="/" icon={<Home {...iconProps} />}>Dashboard</NavItem>
                
                {/* Employee Routes */}
                <NavItem to="/my-expenses" icon={<FileText {...iconProps} />}>My Expenses</NavItem>
                <NavItem to="/chat" icon={<MessageSquare {...iconProps} />}>Chat</NavItem>
                
                {/* Managerial Routes */}
                {approverRoles.includes(user.role) && (
                    <>
                        <h3 className="px-4 mt-4 mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">Approvals & Teams</h3>
                        <NavItem to="/approvals" icon={<CheckSquare {...iconProps} />}>Approvals</NavItem>
                        <NavItem to="/team-expenses" icon={<Briefcase {...iconProps} />}>Team Expenses</NavItem>
                    </>
                )}

                {/* Admin Routes */}
                {user.role === Role.Admin && (
                    <>
                        <h3 className="px-4 mt-4 mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">Admin</h3>
                        <NavItem to="/user-management" icon={<Users {...iconProps} />}>User Management</NavItem>
                        <NavItem to="/workflow-editor" icon={<Settings {...iconProps} />}>Workflows</NavItem>
                        <NavItem to="/company-expenses" icon={<Building2 {...iconProps} />}>Company Expenses</NavItem>
                        <NavItem to="/company-profile" icon={<Users {...iconProps} />}>Company Profile</NavItem>
                    </>
                )}
            </nav>
            <div className="p-4 border-t dark:border-gray-700">
                <NavItem to={`/profile/${user.id}`} icon={<UserIcon {...iconProps} />}>
                    My Profile
                </NavItem>
                <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-600 rounded-md dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                    <LogOut {...iconProps} />
                    Logout
                </button>
            </div>
        </div>
    );
};

const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
    const { user, login } = useAuth();
    const { getCompanyById, getAllUsersInCompany } = useData();
    
    if (!user) return null;
    
    const company = getCompanyById(user.companyId);
    const companyUsers = getAllUsersInCompany(user.companyId).sort((a,b) => a.name.localeCompare(b.name));

    const handleUserSwitch = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedUserId = e.target.value;
        const userToSwitchTo = companyUsers.find(u => u.id === selectedUserId);
        if (userToSwitchTo) {
            login(userToSwitchTo);
        }
    }

    return (
        <header className="flex items-center justify-between h-16 px-6 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
            <button onClick={onMenuClick} className="p-2 text-gray-500 rounded-md md:hidden focus:outline-none focus:ring">
                <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:block">
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">{company?.name || 'Dashboard'}</h1>
            </div>
            <div className="flex items-center">
                <div className="mr-4">
                  <select title="Switch User (Demo Feature)" onChange={handleUserSwitch} value={user.id} className="p-1 text-sm bg-gray-100 border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500">
                      {companyUsers.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                  </select>
                </div>
                 <Link to={`/profile/${user.id}`} className="flex items-center transition-opacity hover:opacity-80">
                    <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-300">Welcome, {user?.name}</span>
                    <div className="ml-2 px-2 py-1 text-xs text-white bg-blue-500 rounded-full">{user?.role}</div>
                </Link>
            </div>
        </header>
    );
};


const Layout: React.FC = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <div className="fixed inset-y-0 left-0 z-30 w-64 h-full transition-transform duration-300 transform md:relative md:translate-x-0">
                <Sidebar isOpen={isSidebarOpen} />
            </div>

            <div className="flex flex-col flex-1">
                <Header onMenuClick={() => setSidebarOpen(!isSidebarOpen)} />
                <main className="flex-1 p-6 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;