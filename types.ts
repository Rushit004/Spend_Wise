import { Icon } from "lucide-react";

export enum Role {
  Employee = 'Employee',
  Manager = 'Manager',
  Finance = 'Finance',
  Director = 'Director',
  CFO = 'CFO',
  Admin = 'Admin',
}

export interface WorkExperience {
  id: string;
  jobTitle: string;
  companyName: string;
  startDate: string; // YYYY-MM
  endDate: string; // YYYY-MM or 'Present'
  description: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  managerId?: string;
  companyId: string;
  phone?: string;
  profilePhotoUrl?: string; // base64 data URL
  about?: string;
  address?: string;
  workExperience?: WorkExperience[];
  friendIds?: string[];
}

export interface Company {
  id: string;
  name: string;
  baseCurrency: string;
  country: string;
}

export enum ExpenseStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

export interface Expense {
  id: string;
  userId: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  currency: string;
  status: ExpenseStatus;
  receiptUrl?: string; // base64
  history: ApprovalAction[];
  currentApproverIds: string[];
  workflowId: string;
  currentStepIndex: number;
}

export interface ApprovalAction {
  approverId: string;
  approverName: string;
  status: ExpenseStatus.Approved | ExpenseStatus.Rejected;
  comment?: string;
  date: string;
}

export enum StepApproverType {
    DirectManager = 'DirectManager',
    SpecificUser = 'SpecificUser',
}

export interface StepApprover {
    id: string;
    type: StepApproverType;
    userId?: string; // for SpecificUser
}

export enum StepCompletionType {
    All = 'All',
    Any = 'Any',
    Percentage = 'Percentage',
}

export interface StepCompletionCondition {
    type: StepCompletionType;
    value?: number; // for Percentage
}

export interface WorkflowStep {
  id:string;
  name: string;
  approvers: StepApprover[];
  completionCondition: StepCompletionCondition;
}

export enum StopConditionType {
    SpecificApprover = 'SpecificApprover',
}

export interface StopCondition {
    id: string;
    type: StopConditionType;
    approverId: string;
}


export interface Workflow {
  id: string;
  name: string;
  companyId: string;
  steps: WorkflowStep[];
  isDefault: boolean;
  stopConditions: StopCondition[];
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string; // ISO String
}