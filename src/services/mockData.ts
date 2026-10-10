import { Agency, Allocation, Container, ContainerSize, ImportBatch, SystemUser } from '../types';

export const CURRENT_USER: SystemUser = {
  id: 'usr-1',
  name: 'Marcus Vance',
  email: 'm.vance@maritime-ops.com',
  role: 'Senior Allocations Officer',
  avatarInitials: 'MV',
};

export const INITIAL_AGENCIES: Agency[] = [
  {
    id: 'ag-1',
    name: 'ABC Clearing',
    contactPerson: 'David K. O’Connor',
    phone: '+1 (555) 234-8901',
    email: 'operations@abcclearing.com',
    address: 'Terminal Gate 4B, Maritime Plaza, Suite 400',
    status: 'Active',
    allocatedCount: 60,
    lastAllocation: '2026-10-05 14:32',
  },
  {
    id: 'ag-2',
    name: 'XYZ Clearing',
    contactPerson: 'Elena Rostova',
    phone: '+1 (555) 345-6712',
    email: 'dispatch@xyzcustoms.com',
    address: '88 Harbor Boulevard, Dockside Logistics Hub',
    status: 'Active',
    allocatedCount: 45,
    lastAllocation: '2026-10-04 11:15',
  },
  {
    id: 'ag-3',
    name: 'MNO Clearing',
    contactPerson: 'Tariq Al-Mansoor',
    phone: '+1 (555) 890-4411',
    email: 'tariq@mnoclearing.com',
    address: 'Pier 12 Logistics Complex, Bay 3',
    status: 'Active',
    allocatedCount: 80,
    lastAllocation: '2026-10-06 09:40',
  },
  {
    id: 'ag-4',
    name: 'Delta Global Logistics',
    contactPerson: 'Sophie Martin',
    phone: '+1 (555) 671-9023',
    email: 'smartin@deltagloballog.com',
    address: 'Commercial Freight Center, Building B2',
    status: 'Active',
    allocatedCount: 0,
    lastAllocation: 'No allocations yet',
  },
  {
    id: 'ag-5',
    name: 'Apex Port Services',
    contactPerson: 'James Thornton',
    phone: '+1 (555) 412-7800',
    email: 'j.thornton@apexportops.com',
    address: 'Outer Harbor Depot, Gate 9',
    status: 'Active',
    allocatedCount: 0,
    lastAllocation: 'No allocations yet',
  },
];

export const INITIAL_BATCHES: ImportBatch[] = [
  {
    id: 'batch-2026-001',
    fileName: 'IMPORT_MANIFEST_OCT_300_CONTAINERS.xlsx',
    fileSize: '1.42 MB',
    uploadDate: '2026-10-03 08:30',
    totalContainers: 300,
    allocatedCount: 185,
    availableCount: 115,
    status: 'Processed',
    uploadedBy: 'Marcus Vance',
  },
  {
    id: 'batch-2026-002',
    fileName: 'PACIFIC_VOYAGE_SEP_180_MANIFEST.xlsx',
    fileSize: '890 KB',
    uploadDate: '2026-09-24 16:15',
    totalContainers: 180,
    allocatedCount: 180,
    availableCount: 0,
    status: 'Processed',
    uploadedBy: 'Sarah Chen',
  },
];

const PREFIXES = ['MSKU', 'CMAU', 'COSU', 'HLCU', 'MEDU', 'ONEU', 'TCLU', 'OOLU'];
const VESSELS = [
  'MSC OSCAR / V.2408W',
  'CMA CGM JACQUES SAADE / V.019E',
  'MAERSK MC-KINNEY MOLLER / V.882N',
  'EVER GIVEN / V.0411S',
  'HAPAG LLOYD AL DAHNA / V.204W',
];
const IMPORTERS = [
  'Global Horizon Trading Ltd',
  'Nordic Retail & Wholesale Group',
  'Pacific Trans-Continental Corp',
  'Atlas Heavy Machinery Inc',
  'Oceanic Commodities Corp',
  'Pinnacle Consumer Electronics',
  'Vanguard Industrial Supplies',
];
const SIZES: ContainerSize[] = ['20FT', '40FT', '40HC', '45FT'];
const PORTS = ['Rotterdam Port (NLRTM)', 'Antwerp Terminal (BEANR)', 'Hamburg Eurogate (DEHAM)'];
const SHIPPING_LINES = ['Maersk Line', 'MSC Mediterranean Shipping', 'CMA CGM', 'COSCO Shipping', 'Hapag-Lloyd'];

export function generateInitialContainers(): Container[] {
  const containers: Container[] = [];
  const total = 300;
  // 60 for ABC Clearing, 45 for XYZ Clearing, 80 for MNO Clearing = 185 allocated, 115 available
  const abcCount = 60;
  const xyzCount = 45;
  const mnoCount = 80;

  for (let i = 1; i <= total; i++) {
    const prefix = PREFIXES[(i * 3 + 1) % PREFIXES.length];
    const number = (1000000 + i * 2938) % 9000000 + 1000000;
    const checkDigit = (i * 7) % 9;
    const containerNo = `${prefix}${number}${checkDigit}`;
    const blNo = `BL-${prefix.slice(0, 3)}-${900000 + i * 47}`;
    const vessel = VESSELS[i % VESSELS.length];
    const importer = IMPORTERS[i % IMPORTERS.length];
    const size = SIZES[i % SIZES.length];
    const weight = `${(18000 + (i * 123) % 12000).toLocaleString()} kg`;
    const port = PORTS[i % PORTS.length];
    const shippingLine = SHIPPING_LINES[i % SHIPPING_LINES.length];
    const etaDay = 10 + (i % 15);
    const eta = `2026-10-${etaDay.toString().padStart(2, '0')}`;

    let status: 'Available' | 'Allocated' = 'Available';
    let agencyId: string | undefined;
    let agencyName: string | undefined;
    let allocatedAt: string | undefined;
    let allocatedBy: string | undefined;

    if (i <= abcCount) {
      status = 'Allocated';
      agencyId = 'ag-1';
      agencyName = 'ABC Clearing';
      allocatedAt = '2026-10-05 14:32';
      allocatedBy = 'Sarah Chen';
    } else if (i <= abcCount + xyzCount) {
      status = 'Allocated';
      agencyId = 'ag-2';
      agencyName = 'XYZ Clearing';
      allocatedAt = '2026-10-04 11:15';
      allocatedBy = 'Marcus Vance';
    } else if (i <= abcCount + xyzCount + mnoCount) {
      status = 'Allocated';
      agencyId = 'ag-3';
      agencyName = 'MNO Clearing';
      allocatedAt = '2026-10-06 09:40';
      allocatedBy = 'Alex Sterling';
    } else {
      status = 'Available';
    }

    containers.push({
      id: `cnt-${i}`,
      containerNo,
      blNo,
      vessel,
      importer,
      eta,
      size,
      weight,
      port,
      shippingLine,
      remarks: i % 7 === 0 ? 'Urgent cold chain priority' : i % 11 === 0 ? 'Customs bonded inspection required' : undefined,
      status,
      agencyId,
      agencyName,
      batchId: 'batch-2026-001',
      allocatedAt,
      allocatedBy,
    });
  }

  return containers;
}

export const INITIAL_CONTAINERS = generateInitialContainers();

export const INITIAL_ALLOCATIONS: Allocation[] = [
  {
    id: 'alloc-103',
    date: '2026-10-06 09:40',
    agencyId: 'ag-3',
    agencyName: 'MNO Clearing',
    containerCount: 80,
    containerIds: INITIAL_CONTAINERS.slice(105, 185).map(c => c.id),
    user: 'Alex Sterling',
    status: 'Completed',
    method: 'Quantity',
    notes: 'Q4 bulk allocation for northern transit freight.',
  },
  {
    id: 'alloc-102',
    date: '2026-10-05 14:32',
    agencyId: 'ag-1',
    agencyName: 'ABC Clearing',
    containerCount: 60,
    containerIds: INITIAL_CONTAINERS.slice(0, 60).map(c => c.id),
    user: 'Sarah Chen',
    status: 'Completed',
    method: 'Quantity',
    notes: 'Fast-track terminal clearance consignment.',
  },
  {
    id: 'alloc-101',
    date: '2026-10-04 11:15',
    agencyId: 'ag-2',
    agencyName: 'XYZ Clearing',
    containerCount: 45,
    containerIds: INITIAL_CONTAINERS.slice(60, 105).map(c => c.id),
    user: 'Marcus Vance',
    status: 'Completed',
    method: 'Manual',
    notes: 'Selective 40HC high-cube unit assignment.',
  },
];
