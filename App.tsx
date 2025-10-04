import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Login from './components/auth/Login';
import SignUp from './components/auth/SignUp';
import Dashboard from './components/dashboard/Dashboard';
import MyExpenses from './components/employee/MyExpenses';
import NewExpense from './components/employee/NewExpense';
import Approvals from './components/manager/Approvals';
import TeamExpenses from './components/manager/TeamExpenses';
import UserManagement from './components/admin/UserManagement';
import WorkflowEditor from './components/admin/WorkflowEditor';
import { Role } from './types';
import Layout from './components/Layout';
import CompanyExpenses from './components/admin/CompanyExpenses';
import Chat from './components/chat/Chat';
import Profile from './components/profile/Profile';
import CompanyProfile from './components/growth/PersonalGrowth';

const ProtectedRoute: React.FC<{ children: React.ReactElement; roles?: Role[] }> = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" />;
  }
  return children;
};

const AppRoutes: React.FC = () => {
    const { user } = useAuth();
    const approverRoles = [Role.Manager, Role.Finance, Role.Director, Role.CFO, Role.Admin];

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="my-expenses" element={<ProtectedRoute><MyExpenses /></ProtectedRoute>} />
                <Route path="new-expense" element={<ProtectedRoute><NewExpense /></ProtectedRoute>} />
                <Route path="chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                <Route path="profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                
                <Route path="approvals" element={<ProtectedRoute roles={approverRoles}><Approvals /></ProtectedRoute>} />
                <Route path="team-expenses" element={<ProtectedRoute roles={approverRoles}><TeamExpenses /></ProtectedRoute>} />
                
                <Route path="user-management" element={<ProtectedRoute roles={[Role.Admin]}><UserManagement /></ProtectedRoute>} />
                <Route path="workflow-editor" element={<ProtectedRoute roles={[Role.Admin]}><WorkflowEditor /></ProtectedRoute>} />
                <Route path="company-expenses" element={<ProtectedRoute roles={[Role.Admin]}><CompanyExpenses /></ProtectedRoute>} />
                <Route path="company-profile" element={<ProtectedRoute roles={[Role.Admin]}><CompanyProfile /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
        </Routes>
    );
};


function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <HashRouter>
            <AppRoutes />
        </HashRouter>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;