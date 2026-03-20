# GS1 Parser PWA

A professional, offline-first Progressive Web App for scanning and managing GS1 barcodes. Built with Next.js, React, Tailwind CSS, and designed with a refined data-focused aesthetic.

## Features

### UI Tabs
1. **Scan** - Camera preview with start/stop controls and image upload
2. **Bulk Paste** - Textarea for pasting multiple barcodes
3. **History** - Comprehensive data table with:
   - Search filtering (barcode digits, product name, batch, serial)
   - Filter chips (Expired, Expiring Soon ≤30d, Missing Expiry)
   - Sort controls (Expiry, Scan Time)
   - Export (TSV, CSV, Copy Last Row)
   - Color-coded expiry badges
4. **Master** - Upload/replace/append master product database
5. **Backup/Restore** - Download/restore JSON backups

### History Table Columns (Exact Order)
- Scan Time
- Raw
- GTIN14
- GTIN13
- Expiry
- Batch
- Serial
- Qty
- Product Name
- Match Type

### Visual Design
- **Typography**: IBM Plex Sans (display) + JetBrains Mono (data/codes)
- **Color Scheme**: Professional blue accents with semantic expiry colors
- **Interactions**: Smooth transitions, hover states, sticky headers
- **Layout**: Clean sheet-like interface inspired by modern data tools

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + Tailwind CSS
- **Icons**: Lucide React
- **TypeScript**: Full type safety
- **PWA**: Offline-capable with manifest

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### PWA Setup (Optional)

To enable full PWA capabilities:

1. Add icons to `/public`:
   - `icon-192.png` (192x192)
   - `icon-512.png` (512x512)
   - `favicon.ico`

2. Add a service worker (optional for offline caching):
   - Create `public/sw.js`
   - Register in `app/layout.tsx`

## Implementation Guide

The UI is complete with **stub functions** ready for your parsing logic. All stubs are located in `app/page.tsx`:

### Core Functions to Implement

```typescript
// 1. Parse raw GS1 barcode string
const parseGs1 = (raw: string) => {
  // TODO: Implement GS1 Application Identifier parsing
  // Extract: GTIN14, GTIN13, Expiry (17), Batch (10), Serial (21), Qty (30)
  return {
    gtin14: '',
    gtin13: '',
    expiry: '',
    batch: '',
    serial: '',
    qty: ''
  };
};

// 2. Build searchable index from master CSV/TSV
const buildMasterIndex = (text: string) => {
  // TODO: Parse CSV/TSV, create GTIN → Product Name lookup
  return { count: 0, index: {} };
};

// 3. Match parsed barcode against master database
const matchProduct = (parsed: any, index: any) => {
  // TODO: Lookup product name by GTIN
  // Return match type: 'exact', 'fuzzy', or 'none'
  return { name: 'Unknown Product', matchType: 'none' };
};
```

### Export Functions (Already Implemented)

These functions are ready and functional:
- `exportTSV(rows)` - Downloads TSV file
- `exportCSV(rows)` - Downloads CSV file
- `copyLastRowTSV(rows)` - Copies last row to clipboard
- `backupJSON(state)` - Downloads JSON backup
- `restoreJSON(json, setState)` - Restores from JSON

### Camera Integration

To add camera scanning:

1. Use the HTML5 `getUserMedia` API or a library like `react-webcam`
2. Capture frames and use a barcode detection library (e.g., `@zxing/library`)
3. Call `parseGs1()` with the detected barcode string
4. Add result to `historyRows` state

Example integration point in `app/page.tsx`:

```typescript
// In the Scan tab component
const handleCameraScan = (barcodeString: string) => {
  const parsed = parseGs1(barcodeString);
  const match = matchProduct(parsed, masterIndex);
  
  const newRow: HistoryRow = {
    id: Date.now().toString(),
    scanTime: new Date(),
    raw: barcodeString,
    ...parsed,
    productName: match.name,
    matchType: match.matchType
  };
  
  updateState({
    historyRows: [...state.historyRows, newRow]
  });
};
```

## State Management

The app uses React `useState` with a centralized `AppState` interface:

```typescript
interface AppState {
  masterLoaded: boolean;
  masterCount: number;
  historyRows: HistoryRow[];
  searchQuery: string;
  filterExpired: boolean;
  filterExpiringSoon: boolean;
  filterMissingExpiry: boolean;
  sortBy: 'expiry' | 'scanTime';
  sortOrder: 'asc' | 'desc';
}
```

Update state using:
```typescript
updateState({ historyRows: [...newRows] })
```

## Data Persistence (To Add)

For offline storage, integrate:

1. **LocalStorage** (simple):
   ```typescript
   localStorage.setItem('gs1-history', JSON.stringify(state.historyRows));
   ```

2. **IndexedDB** (recommended for large datasets):
   - Use a library like `idb` or `Dexie.js`
   - Store history rows and master database separately

## Dummy Data

The app includes 4 sample records to demonstrate the UI. Replace with real scans:

```typescript
const DUMMY_HISTORY: HistoryRow[] = [ /* ... */ ];
```

## File Structure

```
gs1-parser-pwa/
├── app/
│   ├── layout.tsx          # Root layout with PWA metadata
│   ├── page.tsx            # Main app component (★ ALL LOGIC HERE)
│   └── globals.css         # Global styles + Tailwind
├── public/
│   └── manifest.json       # PWA manifest
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── next.config.js
└── README.md
```

## Next Steps

1. **Implement `parseGs1()`**: Add GS1 AI parsing logic
2. **Implement `buildMasterIndex()`**: Parse master CSV/TSV files
3. **Implement `matchProduct()`**: Lookup products by GTIN
4. **Add Camera Support**: Integrate barcode scanner library
5. **Add Persistence**: Save to LocalStorage/IndexedDB
6. **Add Service Worker**: Enable offline caching (optional)
7. **Add Icons**: Create PWA icons (192x192, 512x512)

## GS1 Application Identifiers (AI) Reference

Common AIs you'll need to parse:

- `01` - GTIN (14 digits)
- `10` - Batch/Lot Number
- `17` - Expiry Date (YYMMDD)
- `21` - Serial Number
- `30` - Variable Count/Quantity

Example barcode:
```
01034531200000112117251231102100001234567890
│ │              │ │        │  │
│ └─ GTIN14      │ └─ Date  │  └─ Serial
└─ AI(01)        └─ AI(17)  └─ AI(21)
```

## License

MIT

## Support

This is a ready-to-use UI with placeholder parsing functions. Implement the stubs in `app/page.tsx` to complete the application.
