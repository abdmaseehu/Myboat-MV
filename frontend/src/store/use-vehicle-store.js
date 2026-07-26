import { create } from 'zustand';
import api from '@/lib/axios';

const useVehicleStore = create((set, get) => ({
  // Vehicle data
  vehicles: [],
  totalVehicles: 0,
  page: 1,
  hasMore: true,
  loading: false,
  error: null,
  sortOrder: 'LOW_TO_HIGH',
  filters: {
    priceRange: [0, 10000],
    amenities: [],
    busTypes: [],
    departureTime: null,
    arrivalTime: null,
  },

  // Actions
  setVehicles: (vehicles) => set({ vehicles }),
  setSortOrder: (order) => set({ sortOrder: order }),
  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
  resetFilters: () => set({
    filters: {
      priceRange: [0, 10000],
      amenities: [],
      busTypes: [],
      departureTime: null,
      arrivalTime: null,
    }
  }),

  // Pagination actions
  setPage: (page) => set({ page }),
  setHasMore: (hasMore) => set({ hasMore }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Fetch vehicles with pagination
  fetchVehicles: async (routeId, searchDate) => {
    try {
      const { page, sortOrder, filters } = get();
      set({ loading: true, error: null });

      // First, make a POST request with filters
      const response = await api.get(`/public/vehicles/${routeId}`, {
        ...filters,
        page,
        sort: sortOrder,
        date: searchDate,
      });

      if (response.data.success) {
        const { data, total, hasMore } = response.data;
        set((state) => ({
          vehicles: page === 1 ? data : [...state.vehicles, ...data],
          totalVehicles: total,
          hasMore,
        }));
      } else {
        throw new Error(response.data.message || 'Failed to fetch vehicles');
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      set({ 
        error: error.response?.data?.message || error.message || 'Failed to fetch vehicles',
        vehicles: [],
        totalVehicles: 0,
        hasMore: false
      });
    } finally {
      set({ loading: false });
    }
  },

  // Load more vehicles
  loadMore: async (routeId, searchDate) => {
    const { page, hasMore, loading } = get();
    if (!hasMore || loading) return;

    set({ page: page + 1 });
    await get().fetchVehicles(routeId, searchDate);
  },

  // Apply filters
  applyFilters: async (routeId, searchDate, newFilters) => {
    set({ 
      filters: { ...get().filters, ...newFilters },
      page: 1,
      vehicles: [],
    });
    await get().fetchVehicles(routeId, searchDate);
  },

  // Reset store
  reset: () => set({
    vehicles: [],
    totalVehicles: 0,
    page: 1,
    hasMore: true,
    loading: false,
    error: null,
    sortOrder: 'LOW_TO_HIGH',
    filters: {
      priceRange: [0, 10000],
      amenities: [],
      busTypes: [],
      departureTime: null,
      arrivalTime: null,
    },
  }),
}));

export default useVehicleStore; 