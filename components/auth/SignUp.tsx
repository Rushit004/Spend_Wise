
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { Role } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Wallet } from 'lucide-react';

const simpleHash = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = Math.imul(31, h) + s.charCodeAt(i) | 0;
    }
    return h.toString();
};

interface CountryInfo {
    name: string;
    currency: string;
}

const SignUp: React.FC = () => {
    const [formData, setFormData] = useState({
        companyName: '',
        country: '',
        currency: '',
        adminName: '',
        adminEmail: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [countries, setCountries] = useState<CountryInfo[]>([]);
    const [isLoadingCountries, setIsLoadingCountries] = useState(true);
    const { addCompany, addUser, findUserByEmail } = useData();
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const response = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies');
                const data = await response.json();
                const formattedCountries: CountryInfo[] = data
                    .map((country: any) => {
                        const currencyCode = Object.keys(country.currencies || {})[0];
                        if (!currencyCode) return null;
                        return {
                            name: country.name.common,
                            currency: currencyCode,
                        };
                    })
                    .filter(Boolean) // Remove null entries
                    .sort((a: CountryInfo, b: CountryInfo) => a.name.localeCompare(b.name));

                setCountries(formattedCountries);
                if (formattedCountries.length > 0) {
                    const defaultCountry = formattedCountries.find(c => c.name === 'United States') || formattedCountries[0];
                    setFormData(prev => ({
                        ...prev,
                        country: defaultCountry.name,
                        currency: defaultCountry.currency,
                    }));
                }
            } catch (err) {
                console.error("Failed to fetch countries", err);
                setError("Could not load country data. Please try again later.");
            } finally {
                setIsLoadingCountries(false);
            }
        };

        fetchCountries();
    }, []);

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedCountry = countries.find(c => c.name === e.target.value);
        if (selectedCountry) {
            setFormData({
                ...formData,
                country: selectedCountry.name,
                currency: selectedCountry.currency,
            });
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (findUserByEmail(formData.adminEmail)) {
            setError('An account with this email already exists.');
            return;
        }

        const newCompany = addCompany({
            name: formData.companyName,
            country: formData.country,
            baseCurrency: formData.currency,
        });

        const newAdmin = addUser({
            name: formData.adminName,
            email: formData.adminEmail,
            passwordHash: simpleHash(formData.password),
            role: Role.Admin,
            companyId: newCompany.id,
        });

        login(newAdmin);
        navigate('/');
    };

    return (
        <div className="flex items-center justify-center min-h-screen py-12 bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-lg p-8 space-y-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
                <div className="text-center">
                    <Wallet className="w-12 h-12 mx-auto text-blue-600" />
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                        Create your company account
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Already have an account? <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">Sign in</Link>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && <p className="text-sm text-center text-red-500">{error}</p>}
                    
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Company Information</h3>
                        <input name="companyName" type="text" required placeholder="Company Name" onChange={handleChange} value={formData.companyName} className="w-full px-3 py-2 placeholder-gray-500 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"/>
                        <div className="grid grid-cols-2 gap-4">
                            <select name="country" required onChange={handleCountryChange} value={formData.country} className="w-full px-3 py-2 placeholder-gray-500 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" disabled={isLoadingCountries}>
                                {isLoadingCountries ? <option>Loading countries...</option> : countries.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                            <input name="currency" type="text" required placeholder="Currency" value={formData.currency} disabled className="w-full px-3 py-2 bg-gray-200 border border-gray-300 rounded-md cursor-not-allowed dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300"/>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Your Administrator Account</h3>
                        <input name="adminName" type="text" required placeholder="Full Name" onChange={handleChange} value={formData.adminName} className="w-full px-3 py-2 placeholder-gray-500 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"/>
                        <input name="adminEmail" type="email" required placeholder="Email Address" onChange={handleChange} value={formData.adminEmail} className="w-full px-3 py-2 placeholder-gray-500 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"/>
                        <input name="password" type="password" required placeholder="Password" onChange={handleChange} value={formData.password} className="w-full px-3 py-2 placeholder-gray-500 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"/>
                    </div>

                    <div>
                        <button type="submit" className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md group hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" disabled={isLoadingCountries}>
                            Create Account
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignUp;