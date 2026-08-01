import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useTicketStore = create(
  persist(
    (set, get) => ({
      // True once persisted state has been read back from localStorage.
      // Guards must wait for this — see useTicketStoreHydrated() below.
      hasHydrated: false,

      // Vehicle and booking information
      selectedVehicle: null,
      selectedSeats: [],
      selectedBoardingPoint: null,
      bookingDate: null,
      totalAmount: 0,
      passengerCategory: null, // 'LOCAL' | 'EXPAT' | 'TOURIST'
      currency: 'MVR', // 'MVR' | 'USD'

      setPassengerCategory: (category) =>
        set((state) => ({
          ...state,
          passengerCategory: category,
          currency: category === 'TOURIST' ? 'USD' : 'MVR',
        })),

      // Actions
      setSelectedVehicle: (vehicle) => 
        set((state) => ({
          ...state,
          selectedVehicle: vehicle,
        })),
      
      setSelectedSeats: (seats) => 
        set((state) => ({
          ...state,
          selectedSeats: Array.isArray(seats) ? seats : typeof seats === 'function' ? seats(state.selectedSeats) : [],
        })),
        
      setTotalAmount: (amount) => 
        set((state) => ({
          ...state,
          totalAmount: Number(amount) || 0,
        })),
        
      setSelectedBoardingPoint: (point) => 
        set((state) => ({
          ...state,
          selectedBoardingPoint: point,
        })),
        
      setBookingDate: (date) => 
        set((state) => ({
          ...state,
          bookingDate: date,
        })),

      // Get formatted booking data for API requests
      getBookingData: () => {
        const state = get();
        // Extract seat numbers from selectedSeats array and filter out any null values
        const seatNumbers = state.selectedSeats
          .filter(seat => seat && seat.seatNumber)
          .map(seat => seat.seatNumber);

        return {
          vehicleId: state.selectedVehicle?.id,
          vendorId: state.selectedVehicle?.user?.vendor?.userId,
          routeId: state.selectedVehicle?.route?.id,
          boardingPointId: state.selectedBoardingPoint?.id,
          droppingPointId: state.selectedVehicle?.route?.droppingPoints?.[0]?.id,
          bookingDate: state.bookingDate
            ? new Date(state.bookingDate).toISOString()
            : new Date().toISOString(),
          seatNumbers: state.selectedSeats, // Convert seat numbers array to JSON string
          totalAmount: Number(state.totalAmount),
          discountAmount: 0,
          finalAmount: Number(state.totalAmount),
        };
      },
        
      resetTicketSelection: () =>
        set({
          selectedVehicle: null,
          selectedSeats: [],
          totalAmount: 0,
          selectedBoardingPoint: null,
          bookingDate: null,
          // keep passengerCategory across resets so users don't re-pick per boat
        }),
    }),
    {
      name: 'ticket-store',
      // Hydration is deferred to the client so server and first client render
      // agree. Nothing read the store back before, which meant a full page load
      // (e.g. arriving at checkout after login) always saw an empty selection.
      skipHydration: true,
      // Never persist the flag itself, or a stale `true` would be restored
      // before rehydration actually finished.
      partialize: ({ hasHydrated, ...rest }) => rest,
      onRehydrateStorage: () => () => {
        useTicketStore.setState({ hasHydrated: true });
      },
    }
  )
);

/**
 * Kicks off rehydration on mount and reports when it has finished.
 * Any component that redirects based on store contents must wait for this,
 * otherwise it runs against the empty initial state and bounces the user.
 */
export function useTicketStoreHydrated() {
  const hasHydrated = useTicketStore((state) => state.hasHydrated);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (started) return;
    setStarted(true);
    // Resolves synchronously for localStorage, but await covers custom storages.
    Promise.resolve(useTicketStore.persist.rehydrate()).then(() => {
      // onRehydrateStorage fires for us; this is a belt-and-braces fallback in
      // case there was nothing stored at all.
      if (!useTicketStore.getState().hasHydrated) {
        useTicketStore.setState({ hasHydrated: true });
      }
    });
  }, [started]);

  return hasHydrated;
}

export default useTicketStore;