
import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onDelete: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onDelete }) => {
  const formatDate = (isoDateString: string) => {
    if (!isoDateString) return 'N/A';
    try {
      // Attempt to parse as date for more robust display, fallback for simple strings
      const date = new Date(isoDateString);
      if (isNaN(date.getTime())) return isoDateString; // If not a valid date string, return as is
      // Check if it's just a year or year-month
      if (/^\d{4}$/.test(isoDateString)) return isoDateString; // YYYY
      if (/^\d{4}-\d{2}$/.test(isoDateString)) return new Date(isoDateString + '-01').toLocaleDateString(undefined, { year: 'numeric', month: 'long' }); // YYYY-MM
      
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return isoDateString; // Fallback if parsing fails
    }
  };
  
  const scannedDate = new Date(product.scannedAt).toLocaleString();

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden transform hover:scale-105 transition-transform duration-200 ease-in-out">
      <div className="p-5">
        <h3 className="text-xl font-poppins font-semibold text-neutral-dark mb-2 truncate" title={product.name}>
          {product.name || 'Unnamed Product'}
        </h3>
        <p className="text-sm text-neutral mb-1">
          <span className="font-medium">Expiry Date:</span> {formatDate(product.expiryDate) || 'Not specified'}
        </p>
        <p className="text-xs text-gray-400 mb-4">
          Scanned: {scannedDate}
        </p>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-xs font-medium text-neutral-dark mb-1">Product Name Image:</p>
            {product.nameImageBase64 ? (
              <img src={product.nameImageBase64} alt="Product Name Scan" className="rounded-md object-cover h-24 w-full border border-gray-200" />
            ) : (
              <div className="rounded-md bg-gray-100 h-24 w-full flex items-center justify-center text-xs text-gray-400">No Image</div>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-neutral-dark mb-1">Expiry Date Image:</p>
            {product.expiryImageBase64 ? (
              <img src={product.expiryImageBase64} alt="Expiry Date Scan" className="rounded-md object-cover h-24 w-full border border-gray-200" />
            ) : (
              <div className="rounded-md bg-gray-100 h-24 w-full flex items-center justify-center text-xs text-gray-400">No Image</div>
            )}
          </div>
        </div>

        <button 
          onClick={() => onDelete(product.id)}
          className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
