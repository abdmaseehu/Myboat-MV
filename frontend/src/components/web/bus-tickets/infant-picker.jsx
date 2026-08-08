"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Baby, Minus, Plus } from "lucide-react";

/**
 * Lap infants.
 *
 * Every other passenger is counted by the seats they picked, and their fare
 * band is read off the date of birth they enter — so nobody has to declare an
 * age, and nobody can declare a cheaper one. An infant has neither a seat nor a
 * form, which leaves this as the one number a customer has to tell us.
 *
 * Airlines cap lap infants at one per adult for the obvious reason: an adult
 * has one lap. We do the same.
 */
export default function InfantPicker({ count, onChange, maxInfants, free = true }) {
  const set = (n) => onChange(Math.max(0, Math.min(maxInfants, n)));

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-sky-500/10 flex items-center justify-center">
              <Baby className="h-5 w-5 text-sky-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Travelling with infants?</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Under 2 years, travelling on an adult&apos;s lap.{" "}
                {free
                  ? "They travel free and need no seat or details."
                  : "They need no seat or details."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => set(count - 1)}
              disabled={count <= 0}
              aria-label="Remove an infant"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span
              className="w-8 text-center text-base font-medium tabular-nums"
              aria-live="polite"
            >
              {count}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => set(count + 1)}
              disabled={count >= maxInfants}
              aria-label="Add an infant"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {count >= maxInfants && maxInfants > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            One infant per adult — each needs a lap to travel on.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
