export type ClaimType = 'motor' | 'home' | 'life' | 'travel' | 'health';

export type ClaimStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'info_required'
  | 'approved'
  | 'rejected'
  | 'paid';

export interface StatusStep {
  key: ClaimStatus;
  label: string;
  timestamp?: string;
}

export interface Document {
  id: string;
  uri: string;
  name: string;
  type: 'image' | 'pdf';
  size: number;
  uploadedAt?: string;
  cloudUrl?: string;
}

export interface Message {
  id: string;
  claimId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'adjuster';
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Claim {
  id: string;
  userId: string;
  type: ClaimType;
  title: string;
  description: string;
  incidentDate: string;
  estimatedAmount: number;
  status: ClaimStatus;
  statusHistory: StatusStep[];
  documents: Document[];
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  policyNumber: string;
  adjusterName?: string;
  adjusterNote?: string;
  referenceNumber: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  policyNumber: string;
  expoPushToken?: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  claimId?: string;
  read: boolean;
  createdAt: string;
}