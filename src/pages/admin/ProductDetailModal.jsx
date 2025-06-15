import { calculateFinalPrice } from '../../utils/campaignUtils';

const ProductDetailModal = ({ product, onClose, onAddToCart, campaigns }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calcular el precio final con campaña
  const finalPrice = calculateFinalPrice(product, campaigns);

  const handleAddToCart = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onAddToCart({
        ...product,
        quantity,
        size: selectedSize,
        color: selectedColor,
        price: finalPrice // Usar el precio calculado con campaña
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ... existing code ...
}; 