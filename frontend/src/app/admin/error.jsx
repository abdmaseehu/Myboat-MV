"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Segment error boundary for the whole dashboard.
 *
 * Without this, any client-side exception renders Next's bare
 * "Application error: a client-side exception has occurred" page — no message,
 * no recovery, and nothing to report. Showing the actual error keeps a broken
 * widget from hiding what went wrong.
 */
export default function AdminError({ error, reset }) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Something went wrong on this page
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The rest of the dashboard is still fine — you can retry this page or
            navigate elsewhere using the menu.
          </p>

          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Error details
            </p>
            <p className="text-sm font-mono break-words">
              {error?.message || "Unknown error"}
            </p>
            {error?.digest && (
              <p className="text-xs text-muted-foreground mt-2">
                Reference: {error.digest}
              </p>
            )}
          </div>

          <Button onClick={reset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
