
import React, { useState, useEffect, useCallback } from 'react';
import { Product, ScanStage, Recipe } from './types';
import { extractTextFromImage, suggestRecipesFromIngredients } from './services/geminiService';
import CameraCapture from './components/CameraCapture';
import ProductCard from './components/ProductCard';
import Spinner from './components/Spinner';
import RecipeModal from './components/RecipeModal';

const App: React.FC = () => {
  const [scanStage, setScanStage] = useState<ScanStage>(ScanStage.IDLE);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [currentNameImage, setCurrentNameImage] = useState<string | null>(null);
  const [currentExpiryImage, setCurrentExpiryImage] = useState<string | null>(null);
  
  const [extractedName, setExtractedName] = useState<string>('');
  const [editedName, setEditedName] = useState<string>('');

  const [extractedExpiry, setExtractedExpiry] = useState<string>('');
  const [editedExpiry, setEditedExpiry] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // States for recipe feature
  const [isFetchingRecipes, setIsFetchingRecipes] = useState<boolean>(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipeError, setRecipeError] = useState<string | null>(null);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState<boolean>(false);

  // Load products from localStorage on initial render
  useEffect(() => {
    try {
      const storedProducts = localStorage.getItem('pantryProducts');
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      }
    } catch (e) {
      console.error("Failed to load products from localStorage", e);
      setError("Could not load saved products.");
    }
  }, []);

  // Save products to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('pantryProducts', JSON.stringify(products));
    } catch (e) {
      console.error("Failed to save products to localStorage", e);
      setError("Could not save products. Changes might not persist.");
    }
  }, [products]);

  const resetScanState = () => {
    setCurrentNameImage(null);
    setCurrentExpiryImage(null);
    setExtractedName('');
    setEditedName('');
    setExtractedExpiry('');
    setEditedExpiry('');
    setError(null); // Clear previous errors
  };

  const handleStartScan = () => {
    resetScanState();
    setScanStage(ScanStage.AWAITING_NAME_IMAGE);
  };

  const handleNameImageCapture = useCallback(async (imageBase64: string) => {
    setCurrentNameImage(imageBase64);
    setScanStage(ScanStage.PROCESSING_NAME_IMAGE);
    setIsLoading(true);
    setError(null);
    try {
      const name = await extractTextFromImage(imageBase64, "Identify the primary product name from this image. Provide only the name.");
      setExtractedName(name);
      setEditedName(name); // Pre-fill edited name
      setScanStage(ScanStage.AWAITING_EXPIRY_IMAGE);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to process product name image.");
      setScanStage(ScanStage.AWAITING_NAME_IMAGE); // Go back to allow retake
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleExpiryImageCapture = useCallback(async (imageBase64: string) => {
    setCurrentExpiryImage(imageBase64);
    setScanStage(ScanStage.PROCESSING_EXPIRY_IMAGE);
    setIsLoading(true);
    setError(null);
    try {
      const expiry = await extractTextFromImage(imageBase64, "Identify the expiry date from this image. Provide only the date, ideally in YYYY-MM-DD format if clearly visible, otherwise as seen.");
      setExtractedExpiry(expiry);
      setEditedExpiry(expiry); // Pre-fill edited expiry
      setScanStage(ScanStage.CONFIRM_DETAILS);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to process expiry date image.");
      setScanStage(ScanStage.AWAITING_EXPIRY_IMAGE); // Go back to allow retake
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleSaveProduct = () => {
    if (!editedName.trim()) {
      setError("Product name cannot be empty.");
      return;
    }
    if (!currentNameImage || !currentExpiryImage) {
        setError("Both product name and expiry images are required.");
        return;
    }

    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: editedName.trim(),
      expiryDate: editedExpiry.trim(),
      nameImageBase64: currentNameImage,
      expiryImageBase64: currentExpiryImage,
      scannedAt: new Date().toISOString(),
    };
    setProducts(prevProducts => [newProduct, ...prevProducts]);
    setScanStage(ScanStage.IDLE);
    resetScanState();
  };

  const handleCancelScan = () => {
    setScanStage(ScanStage.IDLE);
    resetScanState();
  };
  
  const handleDeleteProduct = (productId: string) => {
    setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
  };

  const handleSuggestRecipes = async () => {
    if (products.length === 0) {
      setError("Add some items to your pantry first to get recipe suggestions.");
      return;
    }

    setIsFetchingRecipes(true);
    setRecipeError(null);
    setRecipes([]);
    setIsRecipeModalOpen(true);

    try {
      const itemNames = products.map(p => p.name);
      const suggestedRecipes = await suggestRecipesFromIngredients(itemNames);
      if (suggestedRecipes && suggestedRecipes.length > 0) {
        setRecipes(suggestedRecipes);
      } else {
         setRecipeError("Could not find any recipes for the items in your pantry.");
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred while fetching recipes.";
      setRecipeError(errorMessage);
    } finally {
      setIsFetchingRecipes(false);
    }
  };


  const renderContent = () => {
    if (isLoading && (scanStage === ScanStage.PROCESSING_NAME_IMAGE || scanStage === ScanStage.PROCESSING_EXPIRY_IMAGE)) {
      return (
        <div className="flex flex-col items-center justify-center p-8 min-h-[300px] bg-white/50 rounded-lg shadow">
          <Spinner size="lg" />
          <p className="mt-4 text-lg font-poppins text-neutral-dark">
            {scanStage === ScanStage.PROCESSING_NAME_IMAGE ? "Analyzing product name..." : "Analyzing expiry date..."}
          </p>
        </div>
      );
    }

    switch (scanStage) {
      case ScanStage.AWAITING_NAME_IMAGE:
        return (
          <CameraCapture
            onCapture={handleNameImageCapture}
            captureLabel="Capture Product Name"
            instructionText="Center the product name in the frame and capture."
            onClose={handleCancelScan}
          />
        );
      case ScanStage.AWAITING_EXPIRY_IMAGE:
        return (
          <div className="w-full max-w-lg mx-auto">
             {currentNameImage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg shadow">
                <p className="text-sm font-medium text-green-700 mb-1">Product Name Captured:</p>
                <img src={currentNameImage} alt="Product Name Preview" className="rounded-md object-contain max-h-32 mx-auto mb-2 border"/>
                <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Edit Product Name if needed"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
                />
              </div>
            )}
            <CameraCapture
              onCapture={handleExpiryImageCapture}
              captureLabel="Capture Expiry Date"
              instructionText="Now, capture the product's expiry date."
              onClose={handleCancelScan}
            />
          </div>
        );
      case ScanStage.CONFIRM_DETAILS:
        return (
          <div className="p-6 bg-white rounded-xl shadow-xl w-full max-w-lg mx-auto space-y-6">
            <h2 className="text-2xl font-poppins font-semibold text-center text-neutral-dark">Confirm Product Details</h2>
            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md text-sm">{error}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              {currentNameImage && (
                <div>
                  <p className="text-sm font-medium text-neutral mb-1">Name Image:</p>
                  <img src={currentNameImage} alt="Product Name" className="rounded-lg border object-contain max-h-40 w-full" />
                </div>
              )}
              {currentExpiryImage && (
                <div>
                  <p className="text-sm font-medium text-neutral mb-1">Expiry Image:</p>
                  <img src={currentExpiryImage} alt="Expiry Date" className="rounded-lg border object-contain max-h-40 w-full" />
                </div>
              )}
            </div>
            <div>
              <label htmlFor="productName" className="block text-sm font-medium text-neutral-dark mb-1">Product Name</label>
              <input
                id="productName"
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                placeholder="Enter product name"
              />
            </div>
            <div>
              <label htmlFor="expiryDate" className="block text-sm font-medium text-neutral-dark mb-1">Expiry Date</label>
              <input
                id="expiryDate"
                type="text" // Using text to accommodate various formats from AI
                value={editedExpiry}
                onChange={(e) => setEditedExpiry(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                placeholder="Enter expiry date (e.g., YYYY-MM-DD)"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button onClick={handleSaveProduct} className="flex-1 bg-secondary text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-md">
                Save Product
              </button>
              <button onClick={() => setScanStage(ScanStage.AWAITING_NAME_IMAGE)} className="flex-1 bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors shadow-md">
                Retake All
              </button>
            </div>
             <button onClick={handleCancelScan} className="w-full text-center text-neutral hover:text-neutral-dark mt-2 text-sm">
                Cancel
            </button>
          </div>
        );
      case ScanStage.IDLE:
      default:
        return (
          <div className="w-full">
            <div className="w-full max-w-xl mx-auto mb-10 flex flex-col sm:flex-row gap-4">
               <button
                  onClick={handleStartScan}
                  className="flex-1 flex items-center justify-center gap-3 bg-primary text-white px-6 py-4 rounded-xl font-semibold text-lg hover:bg-primary-dark transition-all duration-150 ease-in-out shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Scan New Item
                </button>
                 {products.length > 0 && (
                    <button
                        onClick={handleSuggestRecipes}
                        disabled={isFetchingRecipes}
                        className="flex-1 flex items-center justify-center gap-3 bg-secondary text-white px-6 py-4 rounded-xl font-semibold text-lg hover:bg-green-600 transition-all duration-150 ease-in-out shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:bg-green-300 disabled:cursor-not-allowed"
                        >
                        {isFetchingRecipes ? (
                            <Spinner size="sm" color="text-white"/>
                        ) : (
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                            </svg>
                        )}
                       Suggest Recipes
                    </button>
                )}
            </div>
            
            {products.length > 0 ? (
              <>
                <h2 className="text-2xl font-poppins font-semibold text-neutral-dark mb-6 text-center">Your Pantry Items</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map(product => (
                    <ProductCard key={product.id} product={product} onDelete={handleDeleteProduct} />
                  ))}
                </div>
              </>
            ) : (
             <div className="text-center py-10 px-6 bg-white rounded-lg shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-xl font-poppins text-neutral mb-2">Your pantry is empty!</p>
                <p className="text-sm text-gray-500">Start scanning items to add them to your log.</p>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen container mx-auto p-4 md:p-8">
      <header className="text-center mb-8 md:mb-12">
        <h1 className="text-4xl md:text-5xl font-poppins font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
          Pantry Pal Scanner
        </h1>
        <p className="text-neutral mt-2 text-md md:text-lg">Keep track of your pantry items effortlessly.</p>
      </header>
      
      {error && scanStage !== ScanStage.CONFIRM_DETAILS && ( /* Show general errors not related to confirmation screen validation */
        <div className="my-4 p-4 bg-red-100 text-red-700 rounded-lg shadow text-center">
          <p className="font-medium">Oops! Something went wrong:</p>
          <p className="text-sm">{error}</p>
          <button onClick={() => setError(null)} className="mt-2 text-xs text-red-600 hover:underline">Dismiss</button>
        </div>
      )}

      <main className="flex flex-col items-center">
        {renderContent()}
      </main>

      <RecipeModal
        isOpen={isRecipeModalOpen}
        onClose={() => setIsRecipeModalOpen(false)}
        recipes={recipes}
        isLoading={isFetchingRecipes}
        error={recipeError}
      />

      <footer className="text-center mt-12 py-6 border-t border-gray-200">
        <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Pantry Pal Scanner. AI-Powered Inventory.</p>
      </footer>
    </div>
  );
};

export default App;
