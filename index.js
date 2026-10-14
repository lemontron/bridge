import { call, on } from './imports/bridge';
import { print } from './print/print-receipt';

export const Bridge = {call, print, on};

export { BRIDGE_AVAILABLE } from './imports/bridge';
export { ReceiptPreview } from './print/ReceiptPreview';
export { renderReceiptAsync } from './print/render-receipt';
