import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { ApprovalAction, Expense, ExpenseStatus, Role, User, Workflow, WorkflowStep, StepApproverType, StepCompletionType, StopConditionType } from '../../types';
import { ThumbsUp, ThumbsDown, X, Loader } from 'lucide-react';
import { convertCurrency } from '../../services/currencyService';

const ConvertedAmount: React.FC<{ expense: Expense; baseCurrency: string }> = ({ expense, baseCurrency }) => {
    const [convertedAmount, setConvertedAmount] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const originalAmountFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: expense.currency }).format(expense.amount);

    useEffect(() => {
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

    if (expense.currency === baseCurrency) {
        return <>{originalAmountFormatted}</>;
    }

    return (
        <>
            {originalAmountFormatted}
            {isLoading && <Loader className="inline-block w-4 h-4 ml-2 animate-spin" />}
            {!isLoading && convertedAmount && <span className="ml-2 text-gray-500 dark:text-gray-400">({convertedAmount})</span>}
        </>
    );
};


const ApprovalModal: React.FC<{
    expense: Expense;
    onClose: () => void;
    onApprove: (comment: string) => void;
    onReject: (comment: string) => void;
}> = ({ expense, onClose, onApprove, onReject }) => {
    const { getUserById, getCompanyById } = useData();
    const { user: currentUser } = useAuth();
    const [comment, setComment] = useState('');
    const submitter = getUserById(expense.userId);
    const company = currentUser ? getCompanyById(currentUser.companyId) : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-xl dark:bg-gray-800">
                <div className="flex items-center justify-between pb-3 border-b dark:border-gray-600">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Review Expense</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>
                <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div><span className="font-semibold">Submitted by:</span> {submitter?.name}</div>
                        <div><span className="font-semibold">Date:</span> {expense.date}</div>
                        <div>
                            <span className="font-semibold">Amount:</span>{' '}
                            {company && <ConvertedAmount expense={expense} baseCurrency={company.baseCurrency} />}
                        </div>
                        <div><span className="font-semibold">Category:</span> {expense.category}</div>
                    </div>
                    <div><span className="font-semibold">Description:</span> {expense.description}</div>
                    
                    {expense.history.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-gray-700 dark:text-gray-200">Approval History</h4>
                             <ul className="mt-2 space-y-2 border-l-2 dark:border-gray-600 ml-1 pl-3">
                                {expense.history.map((action, index) => (
                                    <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                                        <span className={`font-medium ${action.status === ExpenseStatus.Approved ? 'text-green-600' : 'text-red-600'}`}>
                                            {action.status}
                                        </span> by {action.approverName} on {new Date(action.date).toLocaleDateString()}.
                                        {action.comment && <p className="pl-4 italic text-gray-500">"{action.comment}"</p>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {expense.receiptUrl && (
                        <div>
                            <p className="font-semibold">Receipt:</p>
                            <img src={expense.receiptUrl} alt="Receipt" className="object-contain w-full mt-2 border rounded-md max-h-80 dark:border-gray-600" />
                        </div>
                    )}

                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add an optional comment..."
                        className="w-full p-2 mt-4 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        rows={3}
                    />
                </div>
                <div className="flex justify-end mt-6 space-x-4">
                    <button onClick={() => onReject(comment)} className="inline-flex items-center px-4 py-2 font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                        <ThumbsDown className="w-4 h-4 mr-2" /> Reject
                    </button>
                    <button onClick={() => onApprove(comment)} className="inline-flex items-center px-4 py-2 font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                        <ThumbsUp className="w-4 h-4 mr-2" /> Approve
                    </button>
                </div>
            </div>
        </div>
    );
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


const Approvals: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { getPendingApprovalsForUser, updateExpense, getUserById, getWorkflowsForCompany, getAllUsersInCompany } = useData();
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    
    if (!currentUser) return null;
    
    const pendingApprovals = getPendingApprovalsForUser(currentUser.id);
    const workflows = getWorkflowsForCompany(currentUser.companyId);
    
    const handleAction = (action: 'approve' | 'reject', comment: string) => {
        if (!selectedExpense) return;
        
        const submitter = getUserById(selectedExpense.userId);
        const workflow = workflows.find(w => w.id === selectedExpense.workflowId);

        if (!submitter || !workflow) {
            console.error("Submitter or workflow not found!");
            return;
        }

        const newHistoryEntry: ApprovalAction = {
            approverId: currentUser.id,
            approverName: currentUser.name,
            status: action === 'approve' ? ExpenseStatus.Approved : ExpenseStatus.Rejected,
            comment: comment,
            date: new Date().toISOString(),
        };

        const newHistory = [...selectedExpense.history, newHistoryEntry];
        let updatedExpense: Expense = { ...selectedExpense, history: newHistory };

        // --- REJECTION ---
        if (action === 'reject') {
            updatedExpense.status = ExpenseStatus.Rejected;
            updatedExpense.currentApproverIds = [];
            updateExpense(updatedExpense);
            setSelectedExpense(null);
            return;
        }

        // --- APPROVAL ---

        // 1. Check for workflow-level stop conditions (e.g., CFO approval)
        const stopConditionMet = workflow.stopConditions.some(c => c.type === StopConditionType.SpecificApprover && c.approverId === currentUser.id);
        if (stopConditionMet) {
            updatedExpense.status = ExpenseStatus.Approved;
            updatedExpense.currentApproverIds = [];
            updateExpense(updatedExpense);
            setSelectedExpense(null);
            return;
        }
        
        // 2. Check for step completion
        if (selectedExpense.currentStepIndex >= workflow.steps.length) {
            console.error("Current step index is out of bounds for the workflow.");
            // This might happen with legacy data if a workflow was changed. We can auto-approve here as a fallback.
            updatedExpense.status = ExpenseStatus.Approved;
            updatedExpense.currentApproverIds = [];
            updateExpense(updatedExpense);
            setSelectedExpense(null);
            return;
        }
        
        const currentStep = workflow.steps[selectedExpense.currentStepIndex];
        const companyUsers = getAllUsersInCompany(currentUser.companyId);
        const allApproversForThisStep = getApproversForStep(currentStep, submitter, companyUsers);
        
        // Find who has already approved in this step by checking history
        const approvedIdsInThisStep = new Set<string>(
            newHistory
                .filter(h => h.status === ExpenseStatus.Approved && allApproversForThisStep.includes(h.approverId))
                .map(h => h.approverId)
        );
        
        let stepComplete = false;
        const condition = currentStep.completionCondition;
        switch (condition.type) {
            case StepCompletionType.All:
                stepComplete = approvedIdsInThisStep.size >= allApproversForThisStep.length;
                break;
            case StepCompletionType.Any:
                stepComplete = approvedIdsInThisStep.size >= 1;
                break;
            case StepCompletionType.Percentage:
                const requiredCount = Math.ceil(allApproversForThisStep.length * ((condition.value || 100) / 100));
                stepComplete = approvedIdsInThisStep.size >= requiredCount;
                break;
        }

        if (stepComplete) {
            // 3a. Step is complete, move to next step or finish workflow
            const nextStepIndex = selectedExpense.currentStepIndex + 1;
            if (nextStepIndex >= workflow.steps.length) {
                // Workflow finished
                updatedExpense.status = ExpenseStatus.Approved;
                updatedExpense.currentApproverIds = [];
            } else {
                // Move to next step
                const nextStep = workflow.steps[nextStepIndex];
                const nextApproverIds = getApproversForStep(nextStep, submitter, companyUsers);
                
                if (nextApproverIds.length > 0) {
                    updatedExpense.currentStepIndex = nextStepIndex;
                    updatedExpense.currentApproverIds = nextApproverIds;
                } else {
                    // Next step has no approvers, so auto-approve and end.
                    updatedExpense.status = ExpenseStatus.Approved;
                    updatedExpense.currentApproverIds = [];
                }
            }
        } else {
            // 3b. Step is not yet complete, just remove current user from pending list
            updatedExpense.currentApproverIds = selectedExpense.currentApproverIds.filter(id => id !== currentUser.id);
        }

        updateExpense(updatedExpense);
        setSelectedExpense(null);
    };


    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pending Approvals</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">Review expenses that require your approval.</p>

            <div className="mt-6 space-y-4">
                {pendingApprovals.length > 0 ? (
                    pendingApprovals.map(expense => {
                        const submitter = getUserById(expense.userId);
                        return (
                            <div key={expense.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md dark:bg-gray-800">
                                <div>
                                    <p className="font-semibold">{expense.description}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Submitted by {submitter?.name} on {expense.date} for {new Intl.NumberFormat('en-US', { style: 'currency', currency: expense.currency }).format(expense.amount)}
                                    </p>
                                </div>
                                <button onClick={() => setSelectedExpense(expense)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                                    Review
                                </button>
                            </div>
                        );
                    })
                ) : (
                    <div className="p-6 text-center bg-white rounded-lg shadow-md dark:bg-gray-800">
                        <p className="text-gray-500 dark:text-gray-400">You have no pending approvals.</p>
                    </div>
                )}
            </div>
            
            {selectedExpense && (
                <ApprovalModal
                    expense={selectedExpense}
                    onClose={() => setSelectedExpense(null)}
                    onApprove={(comment) => handleAction('approve', comment)}
                    onReject={(comment) => handleAction('reject', comment)}
                />
            )}
        </div>
    );
};

export default Approvals;