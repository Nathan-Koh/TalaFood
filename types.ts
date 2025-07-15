
export interface Product {
  id: string;
  name: string;
  expiryDate: string;
  nameImageBase64: string; // Full data URL for display
  expiryImageBase64: string; // Full data URL for display
  scannedAt: string; // ISO string for date
}

export interface Recipe {
  recipeName: string;
  ingredients: string[];
  instructions: string;
}

export enum ScanStage {
  IDLE = 'IDLE',
  AWAITING_NAME_IMAGE = 'AWAITING_NAME_IMAGE',
  PROCESSING_NAME_IMAGE = 'PROCESSING_NAME_IMAGE',
  AWAITING_EXPIRY_IMAGE = 'AWAITING_EXPIRY_IMAGE',
  PROCESSING_EXPIRY_IMAGE = 'PROCESSING_EXPIRY_IMAGE',
  CONFIRM_DETAILS = 'CONFIRM_DETAILS',
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: GroundingChunkWeb;
  // Other types of chunks can be added here if needed
}
