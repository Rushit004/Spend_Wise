import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { User, Role } from '../../types';
import { PlusCircle, Edit, Save, X } from 'lucide-react';

const simpleHash = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = Math.imul(31, h) + s.charCodeAt(i) | 0;
    }
    return h.toString();
};

const UserForm: React.FC<{ user?: User, onSave: () => void, onCancel: () => void }> = ({ user, onSave, onCancel }) => {
    const { user: currentUser } = useAuth();
    const { addUser, updateUser, getAllUsersInCompany, findUserByEmail } = useData();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        role: user?.role || Role.Employee,
        managerId: user?.managerId || '',
    });
    const [error, setError] = useState('');

    if (!currentUser) return null;
    const companyUsers = getAllUsersInCompany(currentUser.companyId);
    const managers = companyUsers.filter(u => u.role !== Role.Employee);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!user && findUserByEmail(formData.email)) {
            setError('User with this email already exists.');
            return;
        }
        if (!user && !formData.password) {
            setError('Password is required for new users.');
            return;
        }

        if (user) {
            updateUser({ ...user, ...formData });
        } else {
            addUser({
                ...formData,
                passwordHash: simpleHash(formData.password),
                companyId: currentUser.companyId,
            });
        }
        onSave();
    };

    const inputStyle = "w-full px-3 py-2 placeholder-gray-500 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white";

    return (
        <form onSubmit={handleSubmit} className="p-4 my-4 space-y-4 bg-gray-100 rounded-lg dark:bg-gray-800">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required className={inputStyle}/>
                <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required disabled={!!user} className={`${inputStyle} ${!!user ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed' : ''}`}/>
                {!user && <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required className={inputStyle}/>}
                <select name="role" value={formData.role} onChange={handleChange} className={inputStyle}>
                    {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select name="managerId" value={formData.managerId} onChange={handleChange} className={inputStyle}>
                    <option value="">No Manager</option>
                    {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end space-x-2">
                <button type="button" onClick={onCancel} className="inline-flex items-center px-4 py-2 font-medium text-gray-700 bg-gray-200 rounded-md dark:bg-gray-700 dark:text-gray-200"><X className="w-4 h-4 mr-1"/>Cancel</button>
                <button type="submit" className="inline-flex items-center px-4 py-2 font-medium text-white bg-blue-600 rounded-md"><Save className="w-4 h-4 mr-1"/>Save</button>
            </div>
        </form>
    )
};


const UserRow: React.FC<{ user: User; onEdit: (user: User) => void }> = ({ user, onEdit }) => {
    const { getUserById } = useData();
    const manager = user.managerId ? getUserById(user.managerId) : null;
    return (
        <tr className="bg-white dark:bg-gray-800">
            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{user.name}</td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">{user.email}</td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">{user.role}</td>
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">{manager?.name || 'N/A'}</td>
            <td className="px-6 py-4 text-sm font-medium text-right">
                <button onClick={() => onEdit(user)} className="text-blue-600 hover:text-blue-900"><Edit className="w-5 h-5"/></button>
            </td>
        </tr>
    );
};

const UserManagement: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { getAllUsersInCompany } = useData();
    const [isAdding, setIsAdding] = useState(false);
    const [editingUser, setEditingUser] = useState<User | undefined>(undefined);

    if (!currentUser) return null;
    const users = useMemo(() => getAllUsersInCompany(currentUser.companyId), [getAllUsersInCompany, currentUser.companyId]);
    
    const handleSave = () => {
        setIsAdding(false);
        setEditingUser(undefined);
    };

    return (
        <div>
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
                {!isAdding && !editingUser && (
                    <button onClick={() => setIsAdding(true)} className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">
                        <PlusCircle className="w-5 h-5 mr-2 -ml-1" />
                        Add User
                    </button>
                )}
            </div>
            
            {(isAdding || editingUser) && (
                <UserForm 
                    user={editingUser}
                    onSave={handleSave} 
                    onCancel={() => { setIsAdding(false); setEditingUser(undefined); }} 
                />
            )}

            <div className="mt-6 overflow-hidden border border-gray-200 rounded-lg shadow-md dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                     <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Name</th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Email</th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Role</th>
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase dark:text-gray-300">Manager</th>
                            <th className="relative px-6 py-3"><span className="sr-only">Edit</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map(u => <UserRow key={u.id} user={u} onEdit={setEditingUser}/>)}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;