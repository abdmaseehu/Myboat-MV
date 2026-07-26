import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useTicketStore = create(
  persist(
    (set, get) => ({
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
      skipHydration: true,
    }
  )
);

export default useTicketStore; 