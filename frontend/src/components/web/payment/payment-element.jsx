import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useTicketStore from "@/store/use-ticket-store";
import api from "@/lib/axios";

export default function PaymentForm({ clientSecret, paymentIntentId, amount }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { getBookingData, resetTicketSelection } = useTicketStore();

  const createBooking = async () => {
    try {
      const bookingData = {
        ...getBookingData(),
        paymentMethod: "STRIPE",
        paymentStatus: "PAID",
        status: "CONFIRMED",
        paymentIntentId,
      };

      const response = await api.post("/payments/create-booking", bookingData);

      if (response.data.success) {
        toast.success("Payment successful! Booking confirmed.");
        resetTicketSelection();
        router.push("/users/bookings");
      }
    } catch (error) {
      console.error("Booking creation error:", error);
      toast.error(error.response?.data?.message || "Failed to create booking");
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      console.error("Stripe not initialized");
      toast.error("Payment system not initialized. Please try again.");
      return;
    }

    setLoading(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw submitError;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/users/bookings`,
        },
        redirect: "if_required",
      });

      if (error) {
        if (error.type === "card_error" || error.type === "validation_error") {
          toast.error(error.message || "Payment failed");
        } else {
          toast.error("An unexpected error occurred");
        }
        return;
      }

      if (paymentIntent.status === "succeeded") {
        await createBooking();
      } else if (paymentIntent.status === "requires_action") {
        // Handle 3D Secure authentication
        const { error: confirmError } = await stripe.confirmPayment({
          clientSecret,
          redirect: "if_required",
        });

        if (confirmError) {
          toast.error(confirmError.message || "Payment authentication failed");
          return;
        }

        await createBooking();
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error.message || "Something went wrong with the payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle>Complete Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement
            className="mb-6"
            options={{
              layout: "tabs",
              paymentMethodOrder: ["card"],
            }}
          />
          <Button
            type="submit"
            disabled={!stripe || loading}
            className="w-full bg-sky-500 text-black hover:bg-sky-600 h-12"
          >
            {loading ? "Processing..." : `Pay $${amount}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
