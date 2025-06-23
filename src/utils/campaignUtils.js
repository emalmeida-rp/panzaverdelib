/**
 * SISTEMA UNIFICADO DE CAMPAÑAS
 * Centraliza toda la lógica de campañas, precios y efectos visuales
 */

// Buscar campaña activa para un producto específico
export function getProductCampaign(product, campaigns = []) {
  if (!product || !Array.isArray(campaigns)) return null;
  
  return campaigns.find(campaign => {
    if (!isCampaignActive(campaign)) return false;
    
    // Campañas de ofertas públicas: buscar por ID embebido
    if (product.campaign?._id && campaign._id === product.campaign._id) {
      return true;
    }
    
    // Verificar si el producto está en la lista de productos de la campaña
    const inCampaign = 
      (campaign.products || []).includes(product._id) ||
      campaign._id === product.campaignId ||
      campaign._id === product.campaign?._id;
    
    return inCampaign;
  }) || null;
}

// Calcular precio final con descuento aplicado
export function calculateFinalPrice(product, campaigns = []) {
  if (!product || typeof product.price !== 'number') return 0;
  
  const campaign = getProductCampaign(product, campaigns);
  if (!campaign || !campaign.discountType || !campaign.discountValue) {
    return Number(product.price.toFixed(2));
  }

  let finalPrice = product.price;
  
  if (campaign.discountType === 'percent') {
    const discountAmount = (product.price * campaign.discountValue) / 100;
    finalPrice = product.price - discountAmount;
  } else if (campaign.discountType === 'fixed') {
    finalPrice = product.price - campaign.discountValue;
  }
  
  // Asegurar que el precio no sea negativo
  finalPrice = Math.max(0, finalPrice);
  
  return Number(finalPrice.toFixed(2));
}

// Calcular el ahorro total
export function calculateSavings(product, campaigns = []) {
  if (!product) return 0;
  
  const originalPrice = product.price;
  const finalPrice = calculateFinalPrice(product, campaigns);
  const savings = originalPrice - finalPrice;
  
  return Number(savings.toFixed(2));
}

// Obtener información completa de precio y campaña
export function getProductPriceInfo(product, campaigns = []) {
  if (!product) return null;
  
  const campaign = getProductCampaign(product, campaigns);
  const finalPrice = calculateFinalPrice(product, campaigns);
  const savings = calculateSavings(product, campaigns);
  const hasDiscount = !!campaign && savings > 0;
  
  return {
    originalPrice: Number(product.price.toFixed(2)),
    finalPrice,
    savings,
    hasDiscount,
    campaign,
    discountPercentage: hasDiscount ? Math.round((savings / product.price) * 100) : 0
  };
}

// Verificar si una campaña está activa (basado en fechas)
export function isCampaignActive(campaign) {
  if (!campaign) return false;

  // Campañas de /campaigns/offers ya están validadas en backend
  if (!campaign.startDate && !campaign.endDate && !('active' in campaign)) {
    return true;
  }

  // Campañas de admin con validación completa
  if (!campaign.active) return false;
  
  const now = new Date();
  const startDate = campaign.startDate ? new Date(campaign.startDate) : null;
  const endDate = campaign.endDate ? new Date(campaign.endDate) : null;
  
  const afterStart = !startDate || now >= startDate;
  const beforeEnd = !endDate || now <= endDate;
  
  return afterStart && beforeEnd;
}

// Filtrar solo campañas activas
export function getActiveCampaigns(campaigns = []) {
  return campaigns.filter(isCampaignActive);
}

// Obtener productos únicos de todas las campañas activas
export function getProductsInActiveCampaigns(campaigns = []) {
  const activeCampaigns = getActiveCampaigns(campaigns);
  const productIds = new Set();
  
  activeCampaigns.forEach(campaign => {
    (campaign.products || []).forEach(productId => {
      if (typeof productId === 'string') {
        productIds.add(productId);
      } else if (productId?._id) {
        productIds.add(productId._id);
      }
    });
  });
  
  return Array.from(productIds);
}

// Formatear texto de descuento para badges
export function formatDiscountText(campaign) {
  if (!campaign || !campaign.discountType || !campaign.discountValue) return '';
  
  if (campaign.discountType === 'percent') {
    return `-${campaign.discountValue}% OFF`;
  } else if (campaign.discountType === 'fixed') {
    return `-$${campaign.discountValue} OFF`;
  }
  
  return '';
} 