/**
 * ABI Loader Module
 * Extrai e valida o ABI do arquivo JSON
 */

import CONTRACT_ARTIFACT from './FieldBooking.json';

// Validar structure
if (!CONTRACT_ARTIFACT) {
  throw new Error('❌ ABI artifact not loaded');
}

if (!CONTRACT_ARTIFACT.abi) {
  throw new Error('❌ ABI artifact structure invalid. Expected CONTRACT_ARTIFACT.abi array');
}

if (!Array.isArray(CONTRACT_ARTIFACT.abi)) {
  throw new Error('❌ CONTRACT_ARTIFACT.abi is not an array. Type: ' + typeof CONTRACT_ARTIFACT.abi);
}

// Export apenas o ABI array
export const FIELD_BOOKING_ABI = CONTRACT_ARTIFACT.abi;

// Make available globally for tests
if (typeof window !== 'undefined') {
  window.FIELD_BOOKING_ABI = CONTRACT_ARTIFACT.abi;
  const methodCount = CONTRACT_ARTIFACT.abi.filter(item => item.type === 'function').length;
  console.log('✅ ABI loaded successfully. Methods count:', methodCount);
}

export default FIELD_BOOKING_ABI;
