# Quick Start Guide

## Get Running in 3 Steps

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open browser
# Navigate to http://localhost:3000
```

## What You'll See

✅ **Fully functional UI** with 5 tabs (Scan, Bulk Paste, History, Master, Backup/Restore)  
✅ **Sample data** - 4 dummy barcode records to demonstrate the interface  
✅ **All features working** - search, filters, sorting, exports, badges  
✅ **Responsive design** - works on desktop and mobile  

## What's Missing (Your Job!)

The UI has **stub functions** ready for your implementation:

### Priority 1: Parsing Logic
📝 **File**: `app/page.tsx`  
🎯 **Function**: `parseGs1(raw: string)`

```typescript
// Currently returns empty strings
// YOU NEED: GS1 AI parser to extract GTIN, expiry, batch, serial, qty
```

### Priority 2: Master Database
📝 **File**: `app/page.tsx`  
🎯 **Function**: `buildMasterIndex(text: string)`

```typescript
// Currently returns { count: 0, index: {} }
// YOU NEED: CSV/TSV parser to build GTIN → Product Name lookup
```

### Priority 3: Product Matching
📝 **File**: `app/page.tsx`  
🎯 **Function**: `matchProduct(parsed, index)`

```typescript
// Currently returns { name: 'Unknown Product', matchType: 'none' }
// YOU NEED: Lookup logic to find product by GTIN
```

### Priority 4: Camera Scanner (Optional)
📝 **File**: `app/page.tsx` - Scan tab  
🎯 **What to add**: Camera access + barcode detection library

```typescript
// Suggested libraries:
// - react-webcam (camera access)
// - @zxing/library (barcode detection)
// - quagga2 (alternative scanner)
```

## Implementation Tips

### 1. Test with Console Logs
All stub functions already log to console. Open DevTools (F12) and watch the Console tab as you click buttons.

### 2. Start Simple
```typescript
// Example: Basic GTIN extraction
const parseGs1 = (raw: string) => {
  // Simplified example - real GS1 needs proper AI parsing
  if (raw.startsWith('01')) {
    const gtin14 = raw.substring(2, 16);
    return { gtin14, gtin13: '', expiry: '', batch: '', serial: '', qty: '' };
  }
  return { gtin14: '', gtin13: '', expiry: '', batch: '', serial: '', qty: '' };
};
```

### 3. Use the Dummy Data
See how the UI works with sample data, then replace it:
```typescript
// In app/page.tsx, replace DUMMY_HISTORY with []
const DUMMY_HISTORY: HistoryRow[] = []; // Start fresh
```

### 4. Add Real Data
Once parsing works, add new rows:
```typescript
updateState({
  historyRows: [...state.historyRows, newRow]
});
```

## File Locations

```
📁 app/page.tsx          ← ALL YOUR WORK GOES HERE
📁 app/layout.tsx        ← PWA metadata (no changes needed)
📁 app/globals.css       ← Styles (no changes needed)
📁 public/manifest.json  ← PWA config (no changes needed)
📁 README.md            ← Full documentation
```

## Common Issues

**Q: UI looks broken?**  
A: Run `npm install` first, then `npm run dev`

**Q: Camera not working?**  
A: Camera access stub is just a placeholder. You need to implement it.

**Q: Exports are empty?**  
A: Export functions work! They export whatever's in `historyRows` (currently dummy data).

**Q: Master database not loading?**  
A: File upload works, but `buildMasterIndex()` is a stub. Implement CSV parsing logic.

## Next Session Goals

1. ✅ Get the app running (`npm run dev`)
2. ✅ Click through all tabs to see the UI
3. ✅ Open DevTools → Console → Click buttons to see stub function logs
4. ✅ Read the GS1 AI reference in README.md
5. 🎯 Implement `parseGs1()` with your GS1 parsing library
6. 🎯 Test with real barcodes!

---

**Remember**: This is a complete, production-quality UI. All you need to do is replace the stub functions with real logic. The UI will automatically update!

Happy coding! 🚀
