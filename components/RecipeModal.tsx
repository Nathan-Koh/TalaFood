
import React from 'react';
import { Recipe } from '../types';
import Spinner from './Spinner';

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  isLoading: boolean;
  error: string | null;
}

const RecipeModal: React.FC<RecipeModalProps> = ({ isOpen, onClose, recipes, isLoading, error }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 transition-opacity"
      aria-labelledby="recipe-modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all"
        onClick={e => e.stopPropagation()} // Prevent closing modal when clicking inside
      >
        <header className="p-5 border-b border-gray-200 flex justify-between items-center">
          <h2 id="recipe-modal-title" className="text-2xl font-poppins font-semibold text-neutral-dark">
            Recipe Suggestions
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close recipe suggestions"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="p-6 overflow-y-auto flex-grow">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-64">
              <Spinner size="lg" />
              <p className="mt-4 text-lg font-poppins text-neutral">Finding delicious recipes...</p>
            </div>
          )}
          {error && !isLoading && (
            <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-semibold text-red-700">Oops! Something went wrong.</p>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          )}
          {!isLoading && !error && recipes.length === 0 && (
            <div className="text-center py-10">
              <p className="text-xl font-poppins text-neutral">No recipes found.</p>
              <p className="text-sm text-gray-500 mt-1">Try adding more pantry items for better suggestions.</p>
            </div>
          )}
          {!isLoading && !error && recipes.length > 0 && (
            <div className="space-y-8">
              {recipes.map((recipe, index) => (
                <div key={index} className="bg-neutral-light/50 p-6 rounded-xl border border-gray-200/80">
                  <h3 className="text-xl font-poppins font-bold text-primary-dark mb-3">{recipe.recipeName}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                     <div className="md:col-span-2">
                        <h4 className="font-semibold text-neutral-dark mb-2">Ingredients</h4>
                        <ul className="list-disc list-inside space-y-1 text-neutral-dark/90 text-sm">
                        {recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                        </ul>
                     </div>
                     <div className="md:col-span-3">
                        <h4 className="font-semibold text-neutral-dark mb-2">Instructions</h4>
                        <p className="text-neutral-dark/90 whitespace-pre-wrap text-sm leading-relaxed">{recipe.instructions}</p>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeModal;
