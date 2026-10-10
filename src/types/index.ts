export type ContainerStatus = 'Available' | 'Allocated';

export type ContainerSize = '20FT' | '40FT' | '40HC' | '45FT';

export interface Container {
  id: string;
  containerNo: string;
  blNo: string;
  vessel: string;
  importer: string;
  eta: string;
  size: ContainerSize;
  weight: string;
  port: string;
  shippingLine: string;
  remarks?: string;
  status: ContainerStatus;
  agencyId?: string;
  agencyName?: string;
  batchId: string;
  allocatedAt?: string;
  allocatedBy?: string;
}

export interface Agency {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  status: 'Active' | 'Inactive';
  allocatedCount: number;
  lastAllocation: string;
}

export interface ImportBatch {
  id: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  totalContainers: number;
  allocatedCount: number;
  availableCount: number;
  status: 'Processed' | 'Validating' | 'Failed';
  uploadedBy: string;
}

export interface Allocation {
  id: string;
  date: string;
  agencyId: string;
  agencyName: string;
  containerCount: number;
  containerIds: string[];
  user: string;
  status: 'Completed' | 'Pending Review';
  method: 'Quantity' | 'Manual';
  notes?: string;
}

export interface ExportColumnOption {
  id: keyof Container | 'exportDate' | 'agencyName';
  label: string;
  defaultSelected: boolean;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarInitials: string;
}

export type NavigationPage = 
  | 'dashboard'
  | 'batches'
  | 'containers'
  | 'allocate'
  | 'agencies'
  | 'history'
  | 'settings';
