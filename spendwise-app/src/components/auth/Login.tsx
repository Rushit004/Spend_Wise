import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Wallet, X } from 'lucide-react';
import { User } from '../../types';

// A simple hashing function for demonstration. 
// DO NOT USE IN PRODUCTION. Use a proper library like bcrypt.
const simpleHash = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = Math.imul(31, h) + s.charCodeAt(i) | 0;
    }
    return h.toString();
};

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, rememberedUsers, forgetUser } = useAuth();
  const { findUserByEmail } = useData();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = findUserByEmail(email);
    if (user && user.passwordHash === simpleHash(password)) {
      login(user, rememberMe);
      navigate('/');
    } else {
      setError('Invalid email or password');
    }
  };

  const handleQuickLogin = (userToLogin: User) => {
      login(userToLogin, true); // Always remember a user who is quick-logged-in
      navigate('/');
  };

  const handleForget = (e: React.MouseEvent, userId: string) => {
      e.stopPropagation(); // Prevent login when clicking 'x'
      forgetUser(userId);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="text-center">
            <Wallet className="w-12 h-12 mx-auto text-blue-600" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                Sign in to SpendWise
            </h2>
        </div>

        {rememberedUsers.length > 0 && (
            <div className="space-y-4">
                <h3 className="text-xs font-semibold text-center text-gray-500 uppercase dark:text-gray-400">Quick Sign In</h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {rememberedUsers.map(u => (
                        <button key={u.id} onClick={() => handleQuickLogin(u)} className="relative flex items-center w-full p-2 space-x-3 text-left bg-gray-100 rounded-md group hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600">
                            <span className="flex items-center justify-center flex-shrink-0 w-8 h-8 font-bold text-white bg-blue-500 rounded-full">{u.name.charAt(0)}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate dark:text-white">{u.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{u.role}</p>
                            </div>
                            <button onClick={(e) => handleForget(e, u.id)} className="absolute top-1 right-1 p-0.5 text-gray-400 rounded-full opacity-0 group-hover:opacity-100 hover:bg-gray-300 dark:hover:bg-gray-500">
                                <X className="w-3 h-3"/>
                            </button>
                        </button>
                    ))}
                </div>
                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                    <span className="flex-shrink px-2 text-sm text-gray-500 dark:text-gray-400">Or sign in manually</span>
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                </div>
            </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && <p className="text-sm text-center text-red-500">{error}</p>}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-none appearance-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-none appearance-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="remember-me" className="block ml-2 text-sm text-gray-900 dark:text-gray-300">
              Remember me
            </label>
          </div>
          <div>
            <button
              type="submit"
              className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md group hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign in
            </button>
          </div>
        </form>
         <p className="mt-4 text-sm text-center text-gray-600 dark:text-gray-400">
            No account?{' '}
            <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            Create a new company
            </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;