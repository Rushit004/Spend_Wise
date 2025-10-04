import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Workflow, WorkflowStep, StepApproverType, Role, StepApprover, StepCompletionType, StepCompletionCondition, StopCondition, StopConditionType } from '../../types';
import { Plus, Trash2, Save, Edit, X, GripVertical } from 'lucide-react';

const inputStyle = "w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white";

const ApproverEditor: React.FC<{ approver: StepApprover; onUpdate: (approver: StepApprover) => void; onDelete: () => void }> = ({ approver, onUpdate, onDelete }) => {
    const { user: currentUser } = useAuth();
    const { getAllUsersInCompany } = useData();
    const companyUsers = currentUser ? getAllUsersInCompany(currentUser.companyId) : [];
    
    return (
        <div className="flex items-center gap-2 p-2 mt-2 bg-gray-100 rounded dark:bg-gray-700">
            <GripVertical className="cursor-move text-gray-400" />
            <select
                value={approver.type}
                onChange={(e) => onUpdate({ ...approver, type: e.target.value as StepApproverType })}
                className={`flex-1 ${inputStyle}`}
            >
                <option value={StepApproverType.DirectManager}>Employee's Direct Manager</option>
                <option value={StepApproverType.SpecificUser}>A Specific User</option>
            </select>

            {approver.type === StepApproverType.SpecificUser && (
                <select
                    value={approver.userId || ''}
                    onChange={(e) => onUpdate({ ...approver, userId: e.target.value })}
                    className={`flex-1 ${inputStyle}`}
                >
                    <option value="">Select User</option>
                    {companyUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
            )}
            <button onClick={onDelete} className="p-2 text-red-500 rounded hover:bg-red-100 dark:hover:bg-red-900"><Trash2 className="w-4 h-4" /></button>
        </div>
    );
};

const StepEditor: React.FC<{ step: WorkflowStep; onUpdate: (step: WorkflowStep) => void; onDelete: () => void; }> = ({ step, onUpdate, onDelete }) => {
    const addApprover = () => {
        onUpdate({ ...step, approvers: [...step.approvers, { id: crypto.randomUUID(), type: StepApproverType.SpecificUser }] });
    };

    const updateApprover = (index: number, newApprover: StepApprover) => {
        const newApprovers = [...step.approvers];
        newApprovers[index] = newApprover;
        onUpdate({ ...step, approvers: newApprovers });
    };

    const deleteApprover = (index: number) => {
        const newApprovers = step.approvers.filter((_, i) => i !== index);
        onUpdate({ ...step, approvers: newApprovers });
    };

    const handleCompletionChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        onUpdate({
            ...step,
            completionCondition: {
                ...step.completionCondition,
                [name]: name === 'value' ? parseInt(value) || 0 : value,
            }
        });
    };

    return (
        <div className="p-4 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600">
            <div className="flex items-center justify-between cursor-move">
                <div className="flex items-center flex-grow">
                  <GripVertical className="mr-2 text-gray-400" />
                  <input
                      type="text"
                      value={step.name}
                      onChange={(e) => onUpdate({ ...step, name: e.target.value })}
                      className="text-lg font-semibold bg-transparent border-b dark:text-white dark:border-gray-500"
                      placeholder="Step Name"
                  />
                </div>
                <button onClick={onDelete} className="p-2 text-red-500 rounded hover:bg-red-100 dark:hover:bg-red-900"><Trash2 className="w-5 h-5"/></button>
            </div>
            
            <div className="mt-4">
                <h4 className="font-medium text-gray-700 dark:text-gray-300">Approvers in this step:</h4>
                 {step.approvers.map((approver, index) => (
                    <ApproverEditor key={approver.id} approver={approver} onUpdate={(newApprover) => updateApprover(index, newApprover)} onDelete={() => deleteApprover(index)} />
                ))}
                <button onClick={addApprover} className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:underline">
                    <Plus className="w-4 h-4" /> Add Approver
                </button>
            </div>
            
            <div className="p-3 mt-4 bg-blue-50 rounded-md dark:bg-gray-700">
                <h4 className="font-medium text-gray-700 dark:text-gray-300">This step is complete when:</h4>
                <div className="flex items-center gap-2 mt-2">
                    <select name="type" value={step.completionCondition.type} onChange={handleCompletionChange} className={inputStyle}>
                        <option value={StepCompletionType.All}>All approvers approve</option>
                        <option value={StepCompletionType.Any}>Any one approver approves</option>
                        <option value={StepCompletionType.Percentage}>A percentage of approvers approve</option>
                    </select>
                    {step.completionCondition.type === StepCompletionType.Percentage && (
                        <div className="flex items-center gap-2">
                           <input type="number" name="value" min="1" max="100" value={step.completionCondition.value || 50} onChange={handleCompletionChange} className={`w-24 ${inputStyle}`} />
                           <span className="font-medium">%</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StopConditionEditor: React.FC<{ condition: StopCondition; onUpdate: (c: StopCondition) => void; onDelete: () => void }> = ({ condition, onUpdate, onDelete }) => {
    const { user: currentUser } = useAuth();
    const { getAllUsersInCompany } = useData();
    const companyUsers = currentUser ? getAllUsersInCompany(currentUser.companyId) : [];

    return (
        <div className="flex items-center gap-2 p-2 mt-2 bg-gray-100 rounded dark:bg-gray-700">
            <span className="flex-shrink-0">If</span>
            <select
                value={condition.approverId || ''}
                onChange={(e) => onUpdate({ ...condition, approverId: e.target.value })}
                className={`flex-1 ${inputStyle}`}
            >
                <option value="">Select User</option>
                {companyUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <span className="flex-shrink-0">approves, auto-approve the entire expense.</span>
            <button onClick={onDelete} className="p-2 text-red-500 rounded hover:bg-red-100 dark:hover:bg-red-900"><Trash2 className="w-4 h-4" /></button>
        </div>
    );
}

const WorkflowEditorComponent: React.FC<{ workflow: Workflow; onSave: (workflow: Workflow) => void; onCancel: () => void }> = ({ workflow, onSave, onCancel }) => {
    const [editedWorkflow, setEditedWorkflow] = useState(workflow);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleDragSort = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        const newSteps = [...editedWorkflow.steps];
        const draggedItemContent = newSteps.splice(dragItem.current, 1)[0];
        newSteps.splice(dragOverItem.current, 0, draggedItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        setEditedWorkflow(prev => ({ ...prev, steps: newSteps }));
    };

    const addStep = () => {
        setEditedWorkflow(prev => ({ ...prev, steps: [...prev.steps, { id: crypto.randomUUID(), name: 'New Step', approvers: [], completionCondition: { type: StepCompletionType.All } }] }));
    };
    const updateStep = (index: number, newStep: WorkflowStep) => {
        const newSteps = [...editedWorkflow.steps];
        newSteps[index] = newStep;
        setEditedWorkflow(prev => ({ ...prev, steps: newSteps }));
    };
    const deleteStep = (index: number) => {
        const newSteps = editedWorkflow.steps.filter((_, i) => i !== index);
        setEditedWorkflow(prev => ({...prev, steps: newSteps}));
    };
    const addStopCondition = () => {
        setEditedWorkflow(prev => ({ ...prev, stopConditions: [...prev.stopConditions, { id: crypto.randomUUID(), type: StopConditionType.SpecificApprover, approverId: '' }] }));
    };
    const updateStopCondition = (index: number, newCondition: StopCondition) => {
        const newConditions = [...editedWorkflow.stopConditions];
        newConditions[index] = newCondition;
        setEditedWorkflow(prev => ({ ...prev, stopConditions: newConditions }));
    };
    const deleteStopCondition = (index: number) => {
        const newConditions = editedWorkflow.stopConditions.filter((_, i) => i !== index);
        setEditedWorkflow(prev => ({ ...prev, stopConditions: newConditions }));
    };

    return (
        <div className="p-6 my-4 bg-gray-50 rounded-lg shadow-md dark:bg-gray-900">
            <input
                type="text"
                value={editedWorkflow.name}
                onChange={(e) => setEditedWorkflow(prev => ({ ...prev, name: e.target.value }))}
                className="w-full mb-4 text-2xl font-bold bg-transparent border-b-2 dark:text-white"
                placeholder="Workflow Name"
            />
            <label className="flex items-center gap-2 mb-4">
                <input
                    type="checkbox"
                    checked={editedWorkflow.isDefault}
                    onChange={(e) => setEditedWorkflow(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                />
                Set as default workflow for the company
            </label>

            <div className="p-4 my-4 border-2 border-dashed rounded-lg dark:border-gray-600">
                <h3 className="text-xl font-semibold">Approval Steps</h3>
                <p className="text-sm text-gray-500">Define the sequential flow for approvals. Drag to re-order.</p>
                <div className="mt-4 space-y-4">
                    {editedWorkflow.steps.map((step, index) => (
                         <div
                            key={step.id}
                            draggable
                            onDragStart={() => dragItem.current = index}
                            onDragEnter={() => dragOverItem.current = index}
                            onDragEnd={handleDragSort}
                            onDragOver={(e) => e.preventDefault()}
                         >
                            <StepEditor step={step} onUpdate={(newStep) => updateStep(index, newStep)} onDelete={() => deleteStep(index)} />
                        </div>
                    ))}
                </div>
                <button onClick={addStep} className="inline-flex items-center px-3 py-1.5 mt-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-1"/> Add Step
                </button>
            </div>

            <div className="p-4 my-4 border-2 border-dashed rounded-lg dark:border-gray-600">
                <h3 className="text-xl font-semibold">Auto-Approval Rules (Stop Conditions)</h3>
                <p className="text-sm text-gray-500">These rules apply to the entire workflow and can end it early.</p>
                 <div className="mt-2">
                    {editedWorkflow.stopConditions.map((cond, index) => (
                        <StopConditionEditor key={cond.id} condition={cond} onUpdate={(newCond) => updateStopCondition(index, newCond)} onDelete={() => deleteStopCondition(index)} />
                    ))}
                 </div>
                <button onClick={addStopCondition} className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:underline">
                    <Plus className="w-4 h-4" /> Add Auto-Approval Rule
                </button>
            </div>

            <div className="flex justify-end mt-6 space-x-2">
                <button onClick={onCancel} className="inline-flex items-center px-4 py-2 font-medium text-gray-700 bg-gray-200 rounded-md dark:bg-gray-600 dark:text-gray-200"><X className="w-4 h-4 mr-1"/>Cancel</button>
                <button onClick={() => onSave(editedWorkflow)} className="inline-flex items-center px-4 py-2 font-medium text-white bg-blue-600 rounded-md"><Save className="w-4 h-4 mr-1"/>Save Workflow</button>
            </div>
        </div>
    );
};


const WorkflowEditor: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { getWorkflowsForCompany, saveWorkflow } = useData();
    const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    if (!currentUser) return null;

    const workflows = getWorkflowsForCompany(currentUser.companyId);

    const handleNewWorkflow = () => {
        setIsCreating(true);
        setEditingWorkflow({
            id: crypto.randomUUID(),
            name: 'New Workflow',
            companyId: currentUser.companyId,
            steps: [],
            isDefault: workflows.length === 0,
            stopConditions: [],
        });
    };

    const handleSave = (workflow: Workflow) => {
        saveWorkflow(workflow);
        setEditingWorkflow(null);
        setIsCreating(false);
    };

    const handleCancel = () => {
        setEditingWorkflow(null);
        setIsCreating(false);
    }

    return (
        <div>
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Workflow Editor</h1>
                {!editingWorkflow && !isCreating && (
                    <button onClick={handleNewWorkflow} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                        <Plus className="w-5 h-5 mr-2" /> New Workflow
                    </button>
                )}
            </div>

            {(editingWorkflow || isCreating) && editingWorkflow ? (
                <WorkflowEditorComponent workflow={editingWorkflow} onSave={handleSave} onCancel={handleCancel} />
            ) : (
                <div className="mt-6 space-y-4">
                    {workflows.length > 0 ? workflows.map(wf => (
                        <div key={wf.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md dark:bg-gray-800">
                            <div>
                                <p className="font-semibold">{wf.name} {wf.isDefault && <span className="ml-2 text-xs text-green-700 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-200 px-2 py-0.5">Default</span>}</p>
                                <p className="text-sm text-gray-500">{wf.steps.length} steps</p>
                            </div>
                            <button onClick={() => setEditingWorkflow(wf)} className="p-2 text-blue-600 rounded hover:bg-blue-100 dark:hover:bg-blue-900"><Edit className="w-5 h-5"/></button>
                        </div>
                    )) : (
                        <div className="p-6 text-center bg-white border-2 border-dashed rounded-lg dark:bg-gray-800 dark:border-gray-600">
                            <p className="text-gray-500 dark:text-gray-400">No workflows found. Create one to get started.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default WorkflowEditor;