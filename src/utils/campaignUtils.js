// Calcula el precio final de un producto según las campañas activas
export function calculateFinalPrice(product, campaigns = []) {
  if (!product) return 0;
  // Buscar si el producto está en alguna campaña activa
  const campaign = Array.isArray(campaigns)
    ? campaigns.find(c => (c.products || []).includes(product._id) || c._id === product.campaignId || c._id === product.campaign?._id)
    : null;

  if (!campaign || !campaign.discountType) return product.price;

  let finalPrice = product.price;
  if (campaign.discountType === 'percent') {
    finalPrice = product.price * (1 - campaign.discountValue / 100);
  } else if (campaign.discountType === 'fixed') {
    finalPrice = Math.max(0, product.price - campaign.discountValue);
  }
  return Number(finalPrice.toFixed(2));
} 