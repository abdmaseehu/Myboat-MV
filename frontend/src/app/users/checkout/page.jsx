"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import useTicketStore, { useTicketStoreHydrated } from "@/store/use-ticket-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Ship, MapPin, CreditCard, Banknote, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import PaymentForm from "@/components/web/payment/payment-element";
import { useSettings } from "@/hooks/use-settings";
import { useAuth } from "@/store/use-auth";
import PassengerDetailsForm, {
  makeEmptyPassenger,
  passengersComplete,
  cleanPassengers,
} from "@/components/web/bus-tickets/passenger-details-form";

export default function CheckoutPage() {
  const router = useRouter();
  const hydrated = useTicketStoreHydrated();
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [bookingComplete, setBookingComplete] = useState(false);
  const [passengers, setPassengers] = useState([]);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [showPassengerErrors, setShowPassengerErrors] = useState(false);
  // Net billing for agents. Read from the API rather than computed here, so
  // the figure shown is the one the server will actually charge.
  const [agentTerms, setAgentTerms] = useState(null);
  const { user } = useAuth();
  const {
    selectedVehicle,
    selectedSeats,
    selectedBoardingPoint,
    bookingDate,
    totalAmount,
    setTotalAmount,
    resetTicketSelection,
    passengerCategory,
    currency,
  } = useTicketStore();

  // Derive the per-seat price from the schedule tier, falling back to seat.price
  const schedule = selectedVehicle?.schedules?.[0] || {};
  const tierPricePerSeat =
    passengerCategory === "LOCAL"
      ? schedule.priceLocalMvr
      : passengerCategory === "EXPAT"
      ? schedule.priceExpatMvr
      : passengerCategory === "TOURIST"
      ? schedule.priceTouristUsd
      : null;

  const currencySymbol = currency === "USD" ? "$" : "MVR";
  const formatMoney = (amt) =>
    `${currencySymbol} ${Number(amt || 0).toFixed(2)}`;

  // Use the settings hook to get the Stripe key
  const {
    value: stripeKey,
    isLoading: isLoadingStripe,
    error: stripeError,
  } = useSettings("STRIPE_PUBLISHABLE_KEY");

  // Initialize Stripe when the key is available
  useEffect(() => {
    console.log("stripeKey", stripeKey);
    const initializeStripe = async () => {
      if (stripeKey) {
        try {
          const stripe = await loadStripe(stripeKey);
          console.log("stripeKey", stripeKey);

          setStripePromise(stripe);
        } catch (error) {
          console.error("Error initializing Stripe:", error);
          toast.error("Failed to initialize payment system");
        }
      }
    };

    initializeStripe();
  }, [stripeKey]);

  // console.log(selectedSeats);

  // Calculate total amount when seats or tier changes
  useEffect(() => {
    const total =
      tierPricePerSeat != null
        ? Number(tierPricePerSeat) * selectedSeats.length
        : selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0);
    setTotalAmount(total);
  }, [selectedSeats, setTotalAmount, tierPricePerSeat]);

  // One passenger block per booked seat. Resized rather than rebuilt so
  // anything already typed survives a seat being added or removed.
  useEffect(() => {
    setPassengers((prev) =>
      selectedSeats.map(
        (seat, i) =>
          prev.find((p) => p.seatKey && p.seatKey === seat.key) ??
          makeEmptyPassenger(seat, i)
      )
    );
  }, [selectedSeats]);

  // Prefill contact from the signed-in account; they can still override it.
  useEffect(() => {
    if (!user) return;
    setContactEmail((v) => v || user.email || "");
    setContactPhone((v) => v || user.mobile || "");
  }, [user]);

  // An agent booking against this operator gets their partnership rate.
  useEffect(() => {
    const vendorId = selectedVehicle?.user?.vendor?.userId;
    if (user?.role !== "AGENT" || !vendorId || !totalAmount) {
      setAgentTerms(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/operator-agents/terms", {
          params: { vendorId, amount: totalAmount },
        });
        if (!cancelled) setAgentTerms(res.data?.data || null);
      } catch {
        // Non-fatal: the server still applies the real terms at booking time.
        if (!cancelled) setAgentTerms(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.role, selectedVehicle, totalAmount]);

  // Only judge the selection once the persisted store has been read back.
  // Running this against the empty initial state sent people home mid-booking.
  useEffect(() => {
    if (!hydrated) return;
    // After a successful booking we deliberately clear the selection, which
    // would otherwise trip this guard and bounce the customer to the homepage
    // instead of their tickets.
    if (bookingComplete) return;
    if (!selectedVehicle || !selectedSeats.length || !selectedBoardingPoint) {
      toast.error("Your booking selection expired. Please pick your seats again.");
      router.push("/");
    }
  }, [
    hydrated,
    bookingComplete,
    selectedVehicle,
    selectedSeats,
    selectedBoardingPoint,
    router,
  ]);

  // Initialize payment intent when selecting card payment
  const initializeStripePayment = async () => {
    try {
      setLoading(true);
      const bookingData = {
        vehicleId: selectedVehicle?.id,
        vendorId: selectedVehicle?.user?.vendor?.userId,
        routeId: selectedVehicle?.route?.id,
        boardingPointId: selectedBoardingPoint?.id,
        droppingPointId: selectedVehicle?.route?.droppingPoints?.[0]?.id,
        bookingDate: new Date(bookingDate).toISOString(),
        seatNumbers: selectedSeats,
        totalAmount: Number(totalAmount),
        discountAmount: 0,
        finalAmount: Number(totalAmount),
        currency: (currency || "MVR").toLowerCase(),
        passengerCategory,
      };

      const response = await api.post("/payments/create-intent", bookingData);

      if (response.data?.data) {
        setClientSecret(response.data.data.clientSecret);
        setPaymentIntentId(response.data.data.paymentIntentId);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Payment initialization error:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to initialize payment. Please try again."
      );
      setPaymentMethod("CASH"); // Reset to cash payment on error
    } finally {
      setLoading(false);
    }
  };

  // Handle payment method change
  const handlePaymentMethodChange = async (method) => {
    try {
      setPaymentMethod(method);
      if (method === "STRIPE") {
        // Check before creating a payment intent, so nobody gets charged and
        // then blocked on a missing passenger name.
        if (!passengerDetailsValid()) {
          setPaymentMethod("CASH");
          return;
        }
        await initializeStripePayment();
      } else {
        setClientSecret("");
        setPaymentIntentId("");
      }
    } catch (error) {
      console.error("Payment method change error:", error);
      toast.error("Failed to change payment method. Please try again.");
      setPaymentMethod("CASH");
    }
  };

  /**
   * Gate on passenger details before any payment is attempted. Returns false
   * and surfaces the errors when something mandatory is missing.
   */
  const passengerDetailsValid = () => {
    const ok =
      passengersComplete(passengers) &&
      contactEmail.trim().length > 0 &&
      contactPhone.trim().length > 0;
    if (!ok) {
      setShowPassengerErrors(true);
      toast.error("Please complete the passenger details first.");
      document
        .getElementById("contact-email")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return ok;
  };

  // Handle cash payment
  const handlePayment = async () => {
    if (!passengerDetailsValid()) return;
    try {
      setLoading(true);
      const vendorId = selectedVehicle?.user?.vendor?.userId;
      if (!vendorId) {
        toast.error("This vessel has no operator assigned. Please contact support.");
        return;
      }

      const bookingData = {
        vehicleId: selectedVehicle.id,
        vendorId,
        routeId: selectedVehicle?.route?.id,
        // The specific departure picked on the search card.
        scheduleId: schedule?.id ?? null,
        boardingPointId: selectedBoardingPoint.id,
        droppingPointId: selectedVehicle?.route?.droppingPoints?.[0]?.id ?? null,
        // The date the customer actually searched for, not today.
        bookingDate: bookingDate
          ? new Date(bookingDate).toISOString()
          : new Date().toISOString(),
        seatNumbers: selectedSeats,
        passengers: cleanPassengers(passengers),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        totalAmount: totalAmount,
        discountAmount: 0,
        finalAmount: totalAmount,
        paymentMethod: "CASH",
        passengerCategory,
        currency: currency || "MVR",
      };

      const response = await api.post("/bookings", bookingData);
      if (response.data.success) {
        toast.success("Booking confirmed! Your e-ticket is ready.");
        setBookingComplete(true);
        resetTicketSelection();
        router.push("/users/bookings");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  // Define the appearance configuration
  const appearance = {
    theme: "stripe",
    variables: {
      colorPrimary: "#eab308",
      colorBackground: "#18181b",
      colorText: "#ffffff",
      colorDanger: "#df1b41",
      fontFamily: "system-ui, sans-serif",
      spacingUnit: "6px",
      borderRadius: "4px",
    },
    rules: {
      ".Tab": {
        border: "1px solid #404040",
        boxShadow: "0px 1px 1px rgba(0, 0, 0, 0.03)",
      },
      ".Tab:hover": {
        color: "#eab308",
      },
      ".Tab--selected": {
        borderColor: "#eab308",
        color: "#eab308",
      },
      ".Input": {
        border: "1px solid #404040",
      },
      ".Input:focus": {
        border: "1px solid #eab308",
      },
    },
  };

  // Wait for the persisted selection before rendering anything that depends on it
  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show loading state while fetching the Stripe key
  if (isLoadingStripe) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show error state if there's an issue loading the Stripe key
  if (stripeError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-destructive">Failed to load payment system</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Checkout</h2>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <PassengerDetailsForm
            passengers={passengers}
            onChange={setPassengers}
            contactEmail={contactEmail}
            contactPhone={contactPhone}
            onContactChange={(field, value) =>
              field === "contactEmail"
                ? setContactEmail(value)
                : setContactPhone(value)
            }
            showErrors={showPassengerErrors}
          />

          {/* Payment Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={handlePaymentMethodChange}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="CASH" id="cash" />
                    <Label htmlFor="cash">Cash Payment</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="STRIPE" id="card" />
                    <Label htmlFor="card">Card Payment</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          {paymentMethod === "STRIPE" && clientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance,
              }}
            >
              <PaymentForm
                clientSecret={clientSecret}
                paymentIntentId={paymentIntentId}
                amount={totalAmount}
                onBookingComplete={() => setBookingComplete(true)}
                passengers={cleanPassengers(passengers)}
                contactEmail={contactEmail.trim()}
                contactPhone={contactPhone.trim()}
                passengerCategory={passengerCategory}
                currency={currency}
              />
            </Elements>
          ) : (
            <Button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-sky-500 text-black hover:bg-sky-600 h-12"
            >
              {loading
                ? "Processing..."
                : `Confirm Cash Payment (${formatMoney(totalAmount)})`}
            </Button>
          )}
        </div>

        {/* Order Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Vehicle Info */}
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-sky-500/10 flex items-center justify-center">
                <Ship className="h-6 w-6 text-sky-500" />
              </div>
              <div>
                <h3 className="font-medium">{selectedVehicle?.vehicleName}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedVehicle?.user?.vendor?.businessName}
                </p>
              </div>
            </div>

            <Separator />

            {/* Boarding Point */}
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-sky-500/10 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-sky-500" />
              </div>
              <div>
                <h3 className="font-medium">Boarding Point</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedBoardingPoint?.locationName}
                </p>
              </div>
            </div>

            <Separator />

            {/* Selected Seats */}
            <div>
              <h3 className="font-medium mb-3">Selected Seats</h3>
              <div className="grid grid-cols-2 gap-3">
                {selectedSeats.map((seat) => (
                  <div
                    key={seat.key}
                    className="p-3 rounded-lg bg-sky-500/10 text-sm"
                  >
                    <div className="font-medium">{seat.seatNumber}</div>
                    <div className="text-muted-foreground">
                      {seat.deck} DECK • {seat.type}
                    </div>
                    <div className="text-sky-500 font-medium">
                      {formatMoney(
                        tierPricePerSeat != null ? tierPricePerSeat : seat.price
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Passenger Category */}
            {passengerCategory && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  Passenger Category
                </span>
                <span className="font-medium">
                  {passengerCategory === "LOCAL"
                    ? "Local Resident"
                    : passengerCategory === "EXPAT"
                    ? "Expat Resident"
                    : "Tourist"}
                </span>
              </div>
            )}

            {/* Agent net billing — shown only when a live partnership applies */}
            {agentTerms?.hasPartnership && agentTerms.discountAmount > 0 && (
              <>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatMoney(totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    Agent rate ({agentTerms.discountPercent}% off)
                  </span>
                  <span className="text-emerald-600">
                    −{formatMoney(agentTerms.discountAmount)}
                  </span>
                </div>
                <Separator />
              </>
            )}

            {/* Total Amount */}
            <div className="flex justify-between items-center font-medium">
              <span>
                {agentTerms?.hasPartnership && agentTerms.discountAmount > 0
                  ? "You pay"
                  : "Total Amount"}
              </span>
              <span className="text-xl text-sky-500">
                {formatMoney(
                  agentTerms?.hasPartnership && agentTerms.finalAmount != null
                    ? agentTerms.finalAmount
                    : totalAmount
                )}
              </span>
            </div>

            {agentTerms?.hasPartnership && agentTerms.commissionAmount > 0 && (
              <p className="text-xs text-muted-foreground">
                You earn {formatMoney(agentTerms.commissionAmount)} commission on
                this booking, settled directly with the operator.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
