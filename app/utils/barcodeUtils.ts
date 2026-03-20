/**
 * GS1 Barcode Utilities
 * Conversion and validation functions for various barcode formats
 */

/**
 * Calculates the modulo-10 check digit for GS1 barcode standards (UPC-A/GTIN-12).
 * The input must be a numeric string representing the base payload.
 */
export function calculateModulo10CheckDigit(baseCode: string): string {
  if (!/^\d+$/.test(baseCode)) {
    throw new Error('Barcode payload must consist entirely of numeric digits.');
  }

  // Convert string payload to array of integers
  const digits = baseCode.split('').map(Number);

  // In a GTIN-12 (UPC-A), length of base is 11.
  // Odd positions in 1-based indexing map to even indices in 0-based Python indexing.
  const oddSum = digits.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0);

  // Even positions map to odd indices
  const evenSum = digits.filter((_, i) => i % 2 === 1).reduce((a, b) => a + b, 0);

  // Multiply odd position sum by 3 and add to even position sum
  const totalSum = oddSum * 3 + evenSum;

  // Execute the modulo 10 arithmetic
  const remainder = totalSum % 10;

  // Calculate the final check digit
  const checkDigit = remainder === 0 ? 0 : 10 - remainder;

  return baseCode + checkDigit;
}

/**
 * Converts a standard 10-digit NDC to a 12-digit UPC-A by prepending
 * the National Health Related Items Code prefix '3' and computing the check digit.
 */
export function convertNdc10ToUpca(ndc10: string): string {
  // Sanitize input by stripping hyphens commonly used in 5-4-1, 5-3-2, or 4-4-2 formats
  const cleanNdc = ndc10.replace(/-/g, '');

  if (cleanNdc.length !== 10) {
    throw new Error(`Invalid NDC length: ${cleanNdc.length}. Expected exactly 10 digits.`);
  }

  // Append the number system character '3' for pharmaceuticals
  const baseCode = '3' + cleanNdc;
  return calculateModulo10CheckDigit(baseCode);
}

/**
 * Expands a 6-digit zero-suppressed UPC-E barcode payload into its
 * equivalent 12-digit UPC-A string, according to GS1 pattern mappings.
 * Assumes standard number system 0.
 */
export function convertUpceToUpca(upce: string): string {
  if (upce.length !== 6 || !/^\d+$/.test(upce)) {
    throw new Error('UPC-E payload must be exactly 6 numeric digits.');
  }

  const lastDigit = upce[5];
  let base: string;

  // Expansion mapping based on the final digit of the suppressed code
  if (['0', '1', '2'].includes(lastDigit)) {
    base = '0' + upce.substring(0, 2) + lastDigit + '0000' + upce.substring(2, 5);
  } else if (lastDigit === '3') {
    base = '0' + upce.substring(0, 3) + '00000' + upce.substring(3, 5);
  } else if (lastDigit === '4') {
    base = '0' + upce.substring(0, 4) + '00000' + upce[4];
  } else if (['5', '6', '7', '8', '9'].includes(lastDigit)) {
    base = '0' + upce.substring(0, 5) + '0000' + lastDigit;
  } else {
    throw new Error('Invalid UPC-E structure encountered.');
  }

  return calculateModulo10CheckDigit(base);
}

/**
 * Validates a GTIN check digit
 */
export function validateGtinCheckDigit(gtin: string): boolean {
  if (!/^\d+$/.test(gtin) || gtin.length < 8) {
    return false;
  }

  const base = gtin.substring(0, gtin.length - 1);
  const providedCheck = gtin[gtin.length - 1];
  const calculatedCheck = calculateModulo10CheckDigit(base).slice(-1);

  return providedCheck === calculatedCheck;
}

/**
 * Converts GTIN-12 (UPC-A) to GTIN-14 by left-padding with zeros
 */
export function convertGtin12ToGtin14(gtin12: string): string {
  if (gtin12.length !== 12) {
    throw new Error('GTIN-12 must be exactly 12 digits.');
  }
  return gtin12.padStart(14, '0');
}

/**
 * Converts GTIN-13 (EAN) to GTIN-14 by left-padding with zeros
 */
export function convertGtin13ToGtin14(gtin13: string): string {
  if (gtin13.length !== 13) {
    throw new Error('GTIN-13 must be exactly 13 digits.');
  }
  return gtin13.padStart(14, '0');
}

/**
 * Extracts GTIN-13 from GTIN-14 by removing leading zeros and recalculating check digit if needed
 */
export function convertGtin14ToGtin13(gtin14: string): string {
  if (gtin14.length !== 14) {
    throw new Error('GTIN-14 must be exactly 14 digits.');
  }
  
  // Remove leading indicator digit (usually 0)
  return gtin14.substring(1);
}

/**
 * Detects barcode format from raw string
 */
export function detectBarcodeFormat(raw: string): {
  format: 'GS1-128' | 'UPC-A' | 'UPC-E' | 'EAN-13' | 'EAN-8' | 'NDC' | 'UNKNOWN';
  confidence: 'high' | 'medium' | 'low';
} {
  const clean = raw.replace(/[^0-9]/g, '');

  // GS1-128 (starts with special chars or AIs)
  if (raw.includes('(') || raw.match(/^01\d{14}/)) {
    return { format: 'GS1-128', confidence: 'high' };
  }

  // NDC format (10 digits, often with hyphens)
  if (raw.match(/^\d{5}-\d{4}-\d{1}$/) || raw.match(/^\d{5}-\d{3}-\d{2}$/) || raw.match(/^\d{4}-\d{4}-\d{2}$/)) {
    return { format: 'NDC', confidence: 'high' };
  }

  // Length-based detection
  switch (clean.length) {
    case 6:
      return { format: 'UPC-E', confidence: 'medium' };
    case 8:
      return { format: 'EAN-8', confidence: 'medium' };
    case 10:
      return { format: 'NDC', confidence: 'medium' };
    case 12:
      return { format: 'UPC-A', confidence: 'high' };
    case 13:
      return { format: 'EAN-13', confidence: 'high' };
    default:
      return { format: 'UNKNOWN', confidence: 'low' };
  }
}

/**
 * Normalizes various barcode formats to GTIN-14
 */
export function normalizeToGtin14(raw: string): string | null {
  try {
    const detection = detectBarcodeFormat(raw);
    const clean = raw.replace(/[^0-9]/g, '');

    switch (detection.format) {
      case 'NDC':
        const upca = convertNdc10ToUpca(raw);
        return convertGtin12ToGtin14(upca);

      case 'UPC-E':
        const upcaExpanded = convertUpceToUpca(clean);
        return convertGtin12ToGtin14(upcaExpanded);

      case 'UPC-A':
        return convertGtin12ToGtin14(clean);

      case 'EAN-13':
        return convertGtin13ToGtin14(clean);

      case 'GS1-128':
        // Extract GTIN from AI(01)
        const gtinMatch = raw.match(/01(\d{14})/);
        if (gtinMatch) {
          return gtinMatch[1];
        }
        return null;

      default:
        return null;
    }
  } catch (error) {
    console.error('Error normalizing barcode:', error);
    return null;
  }
}
