"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Ship, ArrowLeft } from "lucide-react";

export default function BecomeOperatorPage() {
  return (
    <div className="max-w-3xl mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-sky-100 flex items-center justify-center">
              <Ship className="h-6 w-6 text-sky-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">Operator Onboarding</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The operator onboarding flow is under construction. Soon you will be
            able to register your business, add vessels, configure routes and
            start accepting bookings from customers.
          </p>
          <Link href="/users/profile">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Profile
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
