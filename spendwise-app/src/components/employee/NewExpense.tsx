
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { ExpenseStatus, Role, Workflow, User, WorkflowStep, StepApproverType } from '../../types';
import { parseReceiptWithGemini } from '../../services/geminiService';
import { Upload, X, Loader } from 'lucide-react';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // remove data:image/jpeg;base64,
            resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
    });
};

const getApproversForStep = (step: WorkflowStep, submitter: User, allUsers: User[]): string[] => {
    if (!step) return [];
    const approverIds = new Set<string>();

    for (const approver of step.approvers) {
        switch (approver.type) {
            case StepApproverType.DirectManager:
                if (submitter.managerId) {
                    approverIds.add(submitter.managerId);
                } else {
                    const admin = allUsers.find(u => u.role === Role.Admin && u.id !== submitter.id);
                    if (admin) approverIds.add(admin.id);
                }
                break;
            case StepApproverType.SpecificUser:
                if (approver.userId) {
                    approverIds.add(approver.userId);
                }
                break;
        }
    }
    return Array.from(approverIds).filter(id => id !== submitter.id);
};


const NewExpense: React.FC = () => {
    const { user } = useAuth();
    const { addExpense, getWorkflowsForCompany, getAllUsersInCompany } = useData();
    const navigate = useNavigate();

    const [expenseData, setExpenseData] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: 'Other',
        amount: '',
        currency: 'USD',
    });
    const [receipt, setReceipt] = useState<{ file: File, preview: string } | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState('');
    
    if (!user) return null;

    const companyWorkflows = getWorkflowsForCompany(user.companyId);
    const defaultWorkflow = companyWorkflows.find(w => w.isDefault);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setReceipt({ file, preview: URL.createObjectURL(file) });
            setIsScanning(true);
            setError('');
            try {
                const base64Image = await fileToBase64(file);
                const parsedData = await parseReceiptWithGemini(base64Image, file.type);
                if (parsedData) {
                    setExpenseData(prev => ({
                        ...prev,
                        amount: parsedData.amount.toString(),
                        date: parsedData.date,
                        description: parsedData.description,
                        category: parsedData.category,
                    }));
                } else {
                    setError('AI Scan failed. Please enter details manually.');
                }
            } catch (err) {
                setError('Error processing receipt. Please enter details manually.');
                console.error(err);
            } finally {
                setIsScanning(false);
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setExpenseData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!defaultWorkflow) {
            setError('No default workflow configured for your company. Please contact an admin.');
            return;
        }
        
        const amount = parseFloat(expenseData.amount);
        if (isNaN(amount) || amount <= 0) {
            setError('Please enter a valid amount.');
            return;
        }

        const firstStep = defaultWorkflow.steps[0];
        const companyUsers = getAllUsersInCompany(user.companyId);
        const initialApproverIds = firstStep ? getApproversForStep(firstStep, user, companyUsers) : [];


        if (initialApproverIds.length === 0) {
            setError('Could not determine an approver for the first step. The expense is auto-approved. If this is not correct, please contact an admin to configure the workflow.');
            // Auto-approve if no approvers found in the first step.
            const receiptUrl = receipt ? `data:${receipt.file.type};base64,${await fileToBase64(receipt.file)}` : undefined;
            addExpense({
                userId: user.id, ...expenseData, amount: amount,
                status: ExpenseStatus.Approved,
                history: [], receiptUrl: receiptUrl,
                workflowId: defaultWorkflow.id,
                currentStepIndex: 0,
                currentApproverIds: [],
            });
            navigate('/my-expenses');
            return;
        }


        const receiptUrl = receipt ? `data:${receipt.file.type};base64,${await fileToBase64(receipt.file)}` : undefined;

        addExpense({
            userId: user.id,
            ...expenseData,
            amount: amount,
            status: ExpenseStatus.Pending,
            history: [],
            receiptUrl: receiptUrl,
            workflowId: defaultWorkflow.id,
            currentStepIndex: 0,
            currentApproverIds: initialApproverIds,
        });

        navigate('/my-expenses');
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">New Expense</h1>
            <form onSubmit={handleSubmit} className="max-w-2xl mt-6 space-y-8">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Receipt (Optional)</label>
                    <div className="flex items-center justify-center w-full mt-1">
                        <label htmlFor="file-upload" className="relative w-full h-32 px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500">
                            {receipt ? (
                                <>
                                    <img src={receipt.preview} alt="Receipt preview" className="object-contain w-full h-full" />
                                    <button type="button" onClick={() => setReceipt(null)} className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white">
                                        <X className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <div className="space-y-1 text-center">
                                    <Upload className="w-12 h-12 mx-auto text-gray-400" />
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        <span className="font-medium text-blue-600">Upload a file</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                </div>
                            )}
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                        </label>
                    </div>
                    {isScanning && (
                        <div className="flex items-center mt-2 text-sm text-blue-600">
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            Scanning with AI...
                        </div>
                    )}
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <input type="date" name="date" value={expenseData.date} onChange={handleChange} className="w-full px-3 py-2 placeholder-gray-500 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" required/>
                    <select name="category" value={expenseData.category} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" required>
                        <option>Travel</option>
                        <option>Food</option>
                        <option>Office Supplies</option>
                        <option>Software</option>
                        <option>Hardware</option>
                        <option>Utilities</option>
                        <option>Other</option>
                    </select>
                </div>

                <input type="text" name="description" placeholder="Description" value={expenseData.description} onChange={handleChange} className="w-full px-3 py-2 placeholder-gray-500 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" required/>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <input type="number" name="amount" placeholder="Amount" value={expenseData.amount} onChange={handleChange} className="w-full px-3 py-2 placeholder-gray-500 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" required step="0.01"/>
                    <input type="text" name="currency" placeholder="Currency" value={expenseData.currency} onChange={handleChange} className="w-full px-3 py-2 placeholder-gray-500 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" required/>
                </div>
                
                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex justify-end space-x-4">
                    <button type="button" onClick={() => navigate('/my-expenses')} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600">
                        Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700" disabled={isScanning}>
                        {isScanning ? 'Processing...' : 'Submit Expense'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewExpense;
