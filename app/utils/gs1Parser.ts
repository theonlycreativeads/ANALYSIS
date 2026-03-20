/**
 * GS1 Application Identifier Parser
 * Parses GS1-128 barcodes and extracts common Application Identifiers
 */

export interface GS1ParseResult {
  gtin14: string;
  gtin13: string;
  expiry: string;      // ISO format YYYY-MM-DD
  batch: string;
  serial: string;
  qty: string;
  raw: string;
  success: boolean;
  errors: string[];
}

/**
 * GS1 Application Identifier definitions
 * Format: [AI, length, type]
 * Type: 'fixed' or 'variable'
 */
const GS1_AI_DEFINITIONS: Record<string, { length: number; type: 'fixed' | 'variable'; name: string }> = {
  '00': { length: 18, type: 'fixed', name: 'SSCC' },
  '01': { length: 14, type: 'fixed', name: 'GTIN' },
  '02': { length: 14, type: 'fixed', name: 'GTIN of Contained Items' },
  '10': { length: -1, type: 'variable', name: 'Batch/Lot Number' },
  '11': { length: 6, type: 'fixed', name: 'Production Date (YYMMDD)' },
  '12': { length: 6, type: 'fixed', name: 'Due Date (YYMMDD)' },
  '13': { length: 6, type: 'fixed', name: 'Packaging Date (YYMMDD)' },
  '15': { length: 6, type: 'fixed', name: 'Best Before Date (YYMMDD)' },
  '17': { length: 6, type: 'fixed', name: 'Expiration Date (YYMMDD)' },
  '20': { length: 2, type: 'fixed', name: 'Product Variant' },
  '21': { length: -1, type: 'variable', name: 'Serial Number' },
  '30': { length: -1, type: 'variable', name: 'Variable Count' },
  '37': { length: -1, type: 'variable', name: 'Count of Items' },
  '240': { length: -1, type: 'variable', name: 'Additional Product ID' },
  '241': { length: -1, type: 'variable', name: 'Customer Part Number' },
  '250': { length: -1, type: 'variable', name: 'Secondary Serial Number' },
  '251': { length: -1, type: 'variable', name: 'Source Entity' },
  '253': { length: -1, type: 'variable', name: 'Global Document Type ID' },
  '254': { length: -1, type: 'variable', name: 'GLN Extension' },
  '400': { length: -1, type: 'variable', name: 'Customer Purchase Order' },
  '401': { length: -1, type: 'variable', name: 'Consignment Number' },
  '402': { length: 17, type: 'fixed', name: 'Bill of Lading' },
  '403': { length: -1, type: 'variable', name: 'Routing Code' },
  '410': { length: 13, type: 'fixed', name: 'Ship To GLN' },
  '411': { length: 13, type: 'fixed', name: 'Bill To GLN' },
  '412': { length: 13, type: 'fixed', name: 'Purchase From GLN' },
  '413': { length: 13, type: 'fixed', name: 'Ship For GLN' },
  '414': { length: 13, type: 'fixed', name: 'Location Number' },
  '420': { length: -1, type: 'variable', name: 'Ship To Postal Code' },
  '421': { length: -1, type: 'variable', name: 'Ship To Postal Code + ISO' },
};

/**
 * Group Separator character (ASCII 29) used in GS1-128
 */
const GS = String.fromCharCode(29);

/**
 * Parse GS1 date from YYMMDD format to ISO YYYY-MM-DD
 */
function parseGS1Date(yymmdd: string): string {
  if (!yymmdd || yymmdd.length !== 6) return '';

  const yy = parseInt(yymmdd.substring(0, 2));
  const mm = yymmdd.substring(2, 4);
  const dd = yymmdd.substring(4, 6);

  // Assume 20xx for years 00-49, 19xx for 50-99
  const yyyy = yy < 50 ? 2000 + yy : 1900 + yy;

  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Extract Application Identifiers from raw barcode string
 */
function extractAIs(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  let remaining = raw;

  // Remove any parentheses formatting if present
  remaining = remaining.replace(/[()]/g, '');

  while (remaining.length > 0) {
    let foundAI = false;

    // Try to match known AIs (sorted by length descending to match longer AIs first)
    const aiKeys = Object.keys(GS1_AI_DEFINITIONS).sort((a, b) => b.length - a.length);

    for (const ai of aiKeys) {
      if (remaining.startsWith(ai)) {
        const definition = GS1_AI_DEFINITIONS[ai];
        remaining = remaining.substring(ai.length);

        let value: string;

        if (definition.type === 'fixed') {
          // Fixed length AI
          value = remaining.substring(0, definition.length);
          remaining = remaining.substring(definition.length);
        } else {
          // Variable length AI - read until GS or end of string
          const gsIndex = remaining.indexOf(GS);
          if (gsIndex !== -1) {
            value = remaining.substring(0, gsIndex);
            remaining = remaining.substring(gsIndex + 1);
          } else {
            // No GS found, consume rest of string
            value = remaining;
            remaining = '';
          }
        }

        result[ai] = value;
        foundAI = true;
        break;
      }
    }

    // If no AI matched, try to consume one character and continue
    if (!foundAI) {
      remaining = remaining.substring(1);
    }
  }

  return result;
}

/**
 * Main GS1 parser function
 */
export function parseGs1(raw: string): GS1ParseResult {
  const result: GS1ParseResult = {
    gtin14: '',
    gtin13: '',
    expiry: '',
    batch: '',
    serial: '',
    qty: '',
    raw,
    success: false,
    errors: []
  };

  if (!raw || raw.trim().length === 0) {
    result.errors.push('Empty barcode string');
    return result;
  }

  try {
    // Extract all AIs
    const ais = extractAIs(raw);

    // GTIN (AI 01)
    if (ais['01']) {
      result.gtin14 = ais['01'];
      // Convert to GTIN-13 by removing leading zero
      if (result.gtin14.startsWith('0')) {
        result.gtin13 = result.gtin14.substring(1);
      }
    }

    // Expiry Date (AI 17)
    if (ais['17']) {
      result.expiry = parseGS1Date(ais['17']);
    }

    // Batch/Lot Number (AI 10)
    if (ais['10']) {
      result.batch = ais['10'];
    }

    // Serial Number (AI 21)
    if (ais['21']) {
      result.serial = ais['21'];
    }

    // Quantity (AI 30)
    if (ais['30']) {
      result.qty = ais['30'];
    }

    // Mark as successful if we extracted at least a GTIN
    result.success = result.gtin14.length > 0;

    if (!result.success) {
      result.errors.push('No GTIN found in barcode');
    }

  } catch (error) {
    result.errors.push(`Parse error: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
}

/**
 * Parse barcode with auto-detection of format
 */
export function parseAnyBarcode(raw: string): GS1ParseResult {
  const result: GS1ParseResult = {
    gtin14: '',
    gtin13: '',
    expiry: '',
    batch: '',
    serial: '',
    qty: '',
    raw,
    success: false,
    errors: []
  };

  // Try GS1-128 format first
  if (raw.match(/^01\d{14}/) || raw.includes('(01)')) {
    return parseGs1(raw);
  }

  // Try simple GTIN formats
  const clean = raw.replace(/[^0-9]/g, '');

  if (clean.length === 14) {
    result.gtin14 = clean;
    result.gtin13 = clean.substring(1);
    result.success = true;
  } else if (clean.length === 13) {
    result.gtin13 = clean;
    result.gtin14 = '0' + clean;
    result.success = true;
  } else if (clean.length === 12) {
    // UPC-A
    result.gtin14 = '00' + clean;
    result.gtin13 = '0' + clean;
    result.success = true;
  } else {
    result.errors.push(`Unrecognized barcode format (length: ${clean.length})`);
  }

  return result;
}

/**
 * Format parsed result for display
 */
export function formatParseResult(result: GS1ParseResult): string {
  const lines: string[] = [];

  if (result.gtin14) lines.push(`GTIN-14: ${result.gtin14}`);
  if (result.gtin13) lines.push(`GTIN-13: ${result.gtin13}`);
  if (result.expiry) lines.push(`Expiry: ${result.expiry}`);
  if (result.batch) lines.push(`Batch: ${result.batch}`);
  if (result.serial) lines.push(`Serial: ${result.serial}`);
  if (result.qty) lines.push(`Qty: ${result.qty}`);

  if (result.errors.length > 0) {
    lines.push('Errors:');
    result.errors.forEach(err => lines.push(`  - ${err}`));
  }

  return lines.join('\n');
}
