// utils/phone.ts
// Centralized phone utilities for Brazil (BR) and Japan (JP)

// Whitelist of the 67 active DDD codes in Brazil
export const VALID_BR_DDDS = [
  11, 12, 13, 14, 15, 16, 17, 18, 19, // SP
  21, 22, 24,                         // RJ
  27, 28,                            // ES
  31, 32, 33, 34, 35, 37, 38,        // MG
  41, 42, 43, 44, 45, 46,           // PR
  47, 48, 49,                        // SC
  51, 53, 54, 55,                    // RS
  61, 62, 64,                        // GO/DF
  63,                                // TO
  65, 66,                            // MT
  67,                                // MS
  68,                                // AC
  69,                                // RO
  71, 73, 74, 75, 77,                // BA
  79,                                // SE
  81, 87,                            // PE
  82,                                // AL
  83,                                // PB
  84,                                // RN
  85, 88,                            // CE
  86, 89,                            // PI
  91, 93, 94,                        // PA
  92, 97,                            // AM
  95,                                // RR
  96,                                // AP
  98, 99                            // MA
];

/**
 * Format phone number raw string for display
 */
export function formatPhone(raw: string, country: string): string {
  const digits = raw.replace(/\D/g, '');
  
  if (country === 'BR') {
    const nums = digits.slice(0, 11);
    if (nums.length <= 2) return nums;
    if (nums.length <= 6) {
      return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
    }
    if (nums.length <= 10) {
      // Landline format: (XX) XXXX-XXXX
      return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`;
    }
    // Mobile format: (XX) XXXXX-XXXX
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
  }

  // Japan (JP) - formatJapanesePhone logic
  const nums = digits.slice(0, 11);
  if (nums.startsWith('0')) {
    if (nums.length <= 3) return nums;
    if (nums.length <= 7) return `${nums.slice(0, 3)} ${nums.slice(3)}`;
    return `${nums.slice(0, 3)} ${nums.slice(3, 7)} ${nums.slice(7)}`;
  } else {
    if (nums.length <= 2) return nums;
    if (nums.length <= 6) return `${nums.slice(0, 2)} ${nums.slice(2)}`;
    return `${nums.slice(0, 2)} ${nums.slice(2, 6)} ${nums.slice(6)}`;
  }
}

/**
 * Normalize a phone number to E.164 (without the '+' symbol, to match WhatsApp API expectation)
 */
export function normalizeE164(raw: string, country: string): string {
  const nums = raw.replace(/\D/g, '');
  const prefix = country === 'BR' ? '55' : '81';
  
  if (nums.startsWith(prefix)) return nums;
  
  if (country === 'JP' && nums.startsWith('0')) {
    return prefix + nums.slice(1);
  }
  
  return prefix + nums;
}

/**
 * Validate phone number length and DDD correctness
 */
export function validatePhone(digits: string, country: string): boolean {
  const cleaned = digits.replace(/\D/g, '');
  
  if (country === 'BR') {
    if (cleaned.length !== 10 && cleaned.length !== 11) return false;
    const ddd = parseInt(cleaned.slice(0, 2), 10);
    return VALID_BR_DDDS.includes(ddd);
  }
  
  // Japan (JP) length validation: 10 or 11 digits
  return cleaned.length >= 10 && cleaned.length <= 11;
}
