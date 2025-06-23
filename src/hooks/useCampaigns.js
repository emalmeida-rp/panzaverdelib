import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchWithAuth } from '../utils/api';
import { 
  getActiveCampaigns, 
  getProductPriceInfo,
  getProductCampaign,
  calculateFinalPrice,
  formatDiscountText
} from '../utils/campaignUtils';

/**
 * Hook para gestionar campañas y ofertas
 */
export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

    const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchWithAuth('/campaigns/offers');
      if (!response.ok) throw new Error('Error al cargar campañas');
      
      const data = await response.json();
      // Los datos vienen como productos con campaña embebida, extraer campañas únicas
      const campaignsMap = new Map();
      data.forEach(product => {
        if (product.campaign) {
          const campaignId = product.campaign._id;
          
          // Si ya existe la campaña, agregar el producto a su lista
          if (campaignsMap.has(campaignId)) {
            const existingCampaign = campaignsMap.get(campaignId);
            if (!existingCampaign.products) existingCampaign.products = [];
            existingCampaign.products.push(product._id);
          } else {
            // Nueva campaña, crear con lista de productos
            const campaignWithProducts = {
              ...product.campaign,
              products: [product._id],
              active: true // Las ofertas públicas están activas por definición
            };
            campaignsMap.set(campaignId, campaignWithProducts);
          }
        }
      });
      const uniqueCampaigns = Array.from(campaignsMap.values());
      setCampaigns(uniqueCampaigns);
    } catch (err) {
      setError(err.message);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const loadCampaigns = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetchWithAuth('/campaigns/offers');
        if (!response.ok) throw new Error('Error al cargar campañas');
        const data = await response.json();
        
        if (mounted) {
          // Los datos vienen como productos con campaña embebida, extraer campañas únicas
          const campaignsMap = new Map();
          data.forEach(product => {
            if (product.campaign) {
              const campaignId = product.campaign._id;
              
              // Si ya existe la campaña, agregar el producto a su lista
              if (campaignsMap.has(campaignId)) {
                const existingCampaign = campaignsMap.get(campaignId);
                if (!existingCampaign.products) existingCampaign.products = [];
                existingCampaign.products.push(product._id);
              } else {
                // Nueva campaña, crear con lista de productos
                const campaignWithProducts = {
                  ...product.campaign,
                  products: [product._id],
                  active: true // Las ofertas públicas están activas por definición
                };
                campaignsMap.set(campaignId, campaignWithProducts);
              }
            }
          });
          const uniqueCampaigns = Array.from(campaignsMap.values());
          setCampaigns(uniqueCampaigns);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
          setCampaigns([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    loadCampaigns();
    
    return () => { mounted = false; };
  }, []);

  const activeCampaigns = useMemo(() => getActiveCampaigns(campaigns), [campaigns]);
  const getProductInfo = (product) => getProductPriceInfo(product, activeCampaigns);
  const hasDiscount = (product) => !!getProductCampaign(product, activeCampaigns);
  const getDiscountBadge = (product) => formatDiscountText(getProductCampaign(product, activeCampaigns));
  const getFinalPrice = (product) => calculateFinalPrice(product, activeCampaigns);
  const getCampaign = (product) => getProductCampaign(product, activeCampaigns);

  return {
    // Estado básico
    campaigns,
    activeCampaigns,
    loading,
    error,
    
    // Funciones de utilidad
    getProductInfo,
    hasDiscount,
    getDiscountBadge,
    getFinalPrice,
    getCampaign,
    
    // Acción de refresh
    refresh
  };
}; 