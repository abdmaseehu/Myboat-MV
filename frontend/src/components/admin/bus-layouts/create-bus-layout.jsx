"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import * as z from "zod";
import {
  Plus,
  Minus,
  Ship,
  Sailboat,
  Armchair,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

import api from "@/lib/axios";
import Link from "next/link";
import { BreadcrumbNav } from "@/components/ui/breadcrumb";

// Form validation schema
const formSchema = z.object({
  layoutName: z.string().min(2, "Layout name must be at least 2 characters"),
  totalSeats: z.coerce.number().min(1, "Total seats must be at least 1"),
  sleeperSeats: z.coerce.number().min(0).default(0),
  seaterSeats: z.coerce.number().min(0, "Seater seats cannot be negative"),
  hasUpperDeck: z.boolean().default(false),
  upperDeckSeats: z.coerce.number().min(0).default(0),
  sleeperPrice: z.coerce.number().min(0).default(0),
  seaterPrice: z.coerce.number().positive("Price per seat must be positive"),
  rowCount: z.coerce.number().min(1, "Row count must be at least 1"),
  columnCount: z.coerce.number().min(1, "Column count must be at least 1"),
  isActive: z.boolean().default(true),
  layoutJson: z
    .object({
      rows: z.array(z.array(z.string().nullable())),
      seats: z.record(
        z.object({
          type: z.enum(["SEAT", "SLEEPER"]),
          number: z.string(),
          deck: z.enum(["LOWER", "UPPER"]),
        })
      ),
    })
    .optional(),
});

// Vessel type presets
const VESSEL_PRESETS = {
  SPEEDBOAT: {
    rowCount: 5,
    columnCount: 3,
    totalSeats: 15,
    minSeats: 2,
    maxSeats: 25,
    maxRows: 8,
    maxCols: 4,
  },
  FERRY: {
    rowCount: 10,
    columnCount: 4,
    totalSeats: 40,
    minSeats: 30,
    maxSeats: 200,
    maxRows: 25,
    maxCols: 10,
  },
};

const vesselTypes = [
  {
    id: "SPEEDBOAT",
    label: "Speedboat",
    subtitle: "Small vessel (2-25 seats, single deck)",
    icon: Sailboat,
  },
  {
    id: "FERRY",
    label: "Ferry",
    subtitle: "Large vessel (30-200 seats, single deck)",
    icon: Ship,
  },
];

// Seat styles
const seatStyles = {
  base: "relative flex items-center justify-center w-14 h-14 rounded-lg border-2 cursor-pointer transition-all duration-200 select-none hover:scale-105",
  empty:
    "border-dashed border-gray-200 hover:border-sky-500/50 dark:border-gray-700 dark:hover:border-sky-400 hover:bg-sky-50/50 dark:hover:bg-sky-400/10",
  seat: "bg-sky-50 border-sky-500 hover:bg-sky-100 dark:bg-sky-400/20 dark:border-sky-400 dark:hover:bg-sky-400/30 shadow-sm",
  selected:
    "ring-2 ring-offset-2 ring-sky-500 dark:ring-sky-400 dark:ring-offset-gray-900 transform scale-105",
};

export default function CreateBusLayout() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [vesselType, setVesselType] = useState("SPEEDBOAT");
  const [layout, setLayout] = useState({
    lower: Array.from({ length: VESSEL_PRESETS.SPEEDBOAT.rowCount }, () =>
      Array.from({ length: VESSEL_PRESETS.SPEEDBOAT.columnCount }, () => null)
    ),
  });
  const [seatNumbers, setSeatNumbers] = useState({
    lower: { seater: { start: 1, current: 1 } },
  });

  // Initialize form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      layoutName: "",
      totalSeats: 0,
      sleeperSeats: 0,
      seaterSeats: 0,
      hasUpperDeck: false,
      upperDeckSeats: 0,
      sleeperPrice: 0,
      seaterPrice: 0,
      rowCount: VESSEL_PRESETS.SPEEDBOAT.rowCount,
      columnCount: VESSEL_PRESETS.SPEEDBOAT.columnCount,
      isActive: true,
    },
  });

  // Watch for changes in row and column count
  const rowCount = form.watch("rowCount");
  const columnCount = form.watch("columnCount");

  // When vessel type changes, apply defaults
  const handleVesselTypeChange = (type) => {
    setVesselType(type);
    const preset = VESSEL_PRESETS[type];
    form.setValue("rowCount", preset.rowCount);
    form.setValue("columnCount", preset.columnCount);
  };

  // Update layout when row or column count changes
  useEffect(() => {
    const createEmptyLayout = (rows, cols) =>
      Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => null)
      );

    setLayout({
      lower: createEmptyLayout(rowCount, columnCount),
    });

    resetSeatNumbers();
    form.setValue("seaterSeats", 0);
    form.setValue("totalSeats", 0);
  }, [rowCount, columnCount]);

  // Handle seat click
  const handleSeatClick = (rowIndex, colIndex) => {
    const newLayout = {
      lower: layout.lower.map((row, r) =>
        r === rowIndex
          ? row.map((cell, c) =>
              c === colIndex
                ? cell === null
                  ? {
                      type: "SEAT",
                      number: getNextSeatNumber(),
                      deck: "LOWER",
                    }
                  : null
                : cell
            )
          : row
      ),
    };
    setLayout(newLayout);

    // Update form values
    const totalSeater = countSeats(newLayout, "SEAT");
    form.setValue("seaterSeats", totalSeater);
    form.setValue("sleeperSeats", 0);
    form.setValue("totalSeats", totalSeater);
  };

  // Count seats by type
  const countSeats = (layout, type) => {
    let count = 0;
    layout.lower.forEach((row) => {
      row.forEach((seat) => {
        if (seat && seat.type === type) {
          count++;
        }
      });
    });
    return count;
  };

  // Next seat number
  const getNextSeatNumber = () => {
    const currentNumber = seatNumbers.lower.seater.current++;
    return `LS${currentNumber.toString().padStart(2, "0")}`;
  };

  // Reset numbering
  const resetSeatNumbers = () => {
    setSeatNumbers({
      lower: { seater: { start: 1, current: 1 } },
    });
  };

  // Handle row count change
  const handleRowChange = (change) => {
    const preset = VESSEL_PRESETS[vesselType];
    const newRowCount = Math.max(1, Math.min(preset.maxRows, rowCount + change));
    if (newRowCount !== rowCount) {
      form.setValue("rowCount", newRowCount);
    }
  };

  // Handle column count change
  const handleColumnChange = (change) => {
    const preset = VESSEL_PRESETS[vesselType];
    const newColumnCount = Math.max(
      1,
      Math.min(preset.maxCols, columnCount + change)
    );
    if (newColumnCount !== columnCount) {
      form.setValue("columnCount", newColumnCount);
    }
  };

  // Handle form submission
  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const preset = VESSEL_PRESETS[vesselType];
      const lowerDeckRows = [];
      const layoutSeats = {};

      let totalSeaterCount = 0;

      // Process lower deck only (no upper deck for boats)
      layout.lower.forEach((row, rowIndex) => {
        const currentRow = [];
        row.forEach((seat, colIndex) => {
          if (seat) {
            const seatKey = `lower-${rowIndex}-${colIndex}`;
            layoutSeats[seatKey] = {
              type: "SEAT",
              number: seat.number,
              deck: "LOWER",
            };
            totalSeaterCount++;
          }
          currentRow.push(seat ? "SEAT" : null);
        });
        lowerDeckRows.push(currentRow);
      });

      // Validate vessel-type seat range
      if (
        totalSeaterCount < preset.minSeats ||
        totalSeaterCount > preset.maxSeats
      ) {
        toast.error(
          `${vesselType === "SPEEDBOAT" ? "Speedboat" : "Ferry"} must have between ${preset.minSeats} and ${preset.maxSeats} seats (currently ${totalSeaterCount})`
        );
        setLoading(false);
        return;
      }

      // Prepare layout data — force single deck, no sleepers
      const layoutData = {
        ...data,
        seaterSeats: totalSeaterCount,
        sleeperSeats: 0,
        totalSeats: totalSeaterCount,
        hasUpperDeck: false,
        upperDeckSeats: 0,
        sleeperPrice: 0,
        layoutJson: {
          rows: lowerDeckRows,
          seats: layoutSeats,
        },
      };

      const validatedData = formSchema.parse(layoutData);

      const response = await api.post("/bus-layouts", validatedData);

      if (response.data.success) {
        toast.success("Seat layout created successfully");
        router.push("/admin/bus-layouts");
      } else {
        throw new Error(response.data.message || "Failed to create seat layout");
      }
    } catch (error) {
      console.error("Error creating layout:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to create seat layout"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-1 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <BreadcrumbNav
            items={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Seat Layouts", href: "/admin/bus-layouts" },
              { label: "Create Layout" },
            ]}
            className="mb-2"
          />
          <h1 className="text-2xl font-bold tracking-tight">
            Create Seat Layout
          </h1>
          <p className="text-muted-foreground mt-1">
            Design your vessel layout by configuring seats
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="gap-2 border-sky-500 text-sky-600 hover:bg-sky-50 hover:text-sky-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Vessel Type Selector */}
          <Card className="border-sky-100 dark:border-sky-900/50">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-sky-700 dark:text-sky-400 mb-4">
                Vessel Type
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {vesselTypes.map((v) => {
                  const Icon = v.icon;
                  const active = vesselType === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleVesselTypeChange(v.id)}
                      className={cn(
                        "flex items-center gap-4 p-5 rounded-lg border-2 transition-all text-left",
                        active
                          ? "border-sky-500 bg-sky-50 dark:bg-sky-400/10 dark:border-sky-400 shadow-sm"
                          : "border-gray-200 hover:border-sky-300 dark:border-gray-700 dark:hover:border-sky-500"
                      )}
                    >
                      <div
                        className={cn(
                          "p-3 rounded-md",
                          active
                            ? "bg-sky-500 text-white dark:bg-sky-400 dark:text-gray-900"
                            : "bg-sky-50 text-sky-500 dark:bg-sky-400/10 dark:text-sky-400"
                        )}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-base">
                          {v.label}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {v.subtitle}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Basic Info Card */}
          <Card className="border-sky-100 dark:border-sky-900/50">
            <CardContent className="p-6 grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="layoutName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Layout Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Ferry Deluxe 40 or Speedboat Standard 15"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Give your layout a descriptive name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Disable to hide this layout from being used
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Layout Configuration Card */}
          <Card className="border-sky-100 dark:border-sky-800">
            <CardContent className="p-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-sky-700 dark:text-sky-400">
                  Layout Configuration
                </h3>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Left Column - Row & Column Controls */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sky-700 dark:text-sky-400">
                        Grid Size
                      </h4>
                      <div className="flex items-center gap-4">
                        <FormLabel className="w-24 text-sky-700 dark:text-sky-400">
                          Rows
                        </FormLabel>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleRowChange(-1)}
                            className="border-sky-200 hover:border-sky-500 hover:bg-sky-50 dark:border-sky-800 dark:hover:border-sky-400 dark:hover:bg-sky-400/10"
                          >
                            <Minus className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                          </Button>
                          <span className="w-12 text-center font-medium text-sky-700 dark:text-sky-400">
                            {rowCount}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleRowChange(1)}
                            className="border-sky-200 hover:border-sky-500 hover:bg-sky-50 dark:border-sky-800 dark:hover:border-sky-400 dark:hover:bg-sky-400/10"
                          >
                            <Plus className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <FormLabel className="w-24 text-sky-700 dark:text-sky-400">
                          Columns
                        </FormLabel>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleColumnChange(-1)}
                            className="border-sky-200 hover:border-sky-500 hover:bg-sky-50 dark:border-sky-800 dark:hover:border-sky-400 dark:hover:bg-sky-400/10"
                          >
                            <Minus className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                          </Button>
                          <span className="w-12 text-center font-medium text-sky-700 dark:text-sky-400">
                            {columnCount}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleColumnChange(1)}
                            className="border-sky-200 hover:border-sky-500 hover:bg-sky-50 dark:border-sky-800 dark:hover:border-sky-400 dark:hover:bg-sky-400/10"
                          >
                            <Plus className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {vesselType === "SPEEDBOAT"
                          ? "Speedboat: 2-25 total seats"
                          : "Ferry: 30-200 total seats"}
                      </p>
                    </div>
                  </div>

                  {/* Right Column - Price Controls */}
                  <div className="space-y-6">
                    <h4 className="font-medium text-sky-700 dark:text-sky-400">
                      Pricing
                    </h4>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="seaterPrice"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-4">
                              <FormLabel className="w-32 text-sky-700 dark:text-sky-400">
                                Price per Seat
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  className="border-sky-200 focus-visible:ring-sky-500 dark:border-sky-800 dark:focus-visible:ring-sky-400 dark:bg-gray-950 dark:text-sky-400 dark:placeholder-sky-400/50"
                                  {...field}
                                />
                              </FormControl>
                            </div>
                            <FormMessage className="text-red-500 dark:text-red-400 ml-36" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seat Designer Card */}
          <Card className="border-sky-100 dark:border-sky-800">
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-sky-700 dark:text-sky-400">
                    Seat Designer
                  </h3>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-sky-50 dark:bg-sky-400/10 text-sm text-sky-700 dark:text-sky-400">
                    <Armchair className="h-4 w-4" />
                    Click a cell to place or remove a seat
                  </div>
                </div>

                <Tabs defaultValue="LOWER" value="LOWER" className="w-full">
                  <TabsList className="w-full bg-sky-50 dark:bg-sky-400/10">
                    <TabsTrigger
                      value="LOWER"
                      className="w-full data-[state=active]:bg-sky-500 data-[state=active]:text-white dark:data-[state=active]:bg-sky-400 dark:data-[state=active]:text-gray-900"
                    >
                      Deck Layout
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="LOWER" className="mt-4">
                    <div className="relative p-6 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-800">
                      <div className="absolute left-2 top-2 p-2 bg-sky-50 dark:bg-sky-400/10 rounded-md">
                        {vesselType === "SPEEDBOAT" ? (
                          <Sailboat className="w-5 h-5 text-sky-500 dark:text-sky-400" />
                        ) : (
                          <Ship className="w-5 h-5 text-sky-500 dark:text-sky-400" />
                        )}
                      </div>
                      <div
                        className="grid gap-4 justify-center"
                        style={{
                          gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                        }}
                      >
                        {layout.lower.map((row, rowIndex) =>
                          row.map((seat, colIndex) => (
                            <div
                              key={`${rowIndex}-${colIndex}`}
                              className={cn(
                                seatStyles.base,
                                !seat ? seatStyles.empty : seatStyles.seat,
                                "hover:scale-105 transition-transform"
                              )}
                              onClick={() =>
                                handleSeatClick(rowIndex, colIndex)
                              }
                            >
                              {seat && (
                                <>
                                  <Armchair className="w-5 h-5" />
                                  <span className="absolute -top-2 -right-2 bg-white dark:bg-zinc-800 border rounded-full w-6 h-6 text-[10px] font-medium flex items-center justify-center shadow-sm">
                                    {seat.number}
                                  </span>
                                </>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sky-700 dark:text-sky-400">
                      Seat Count
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg border border-sky-200 bg-sky-50/50 p-3 dark:border-sky-800 dark:bg-sky-400/10">
                        <div className="text-sm text-sky-600 dark:text-sky-400">
                          Total Seats
                        </div>
                        <div className="text-2xl font-bold text-sky-700 dark:text-sky-400">
                          {form.watch("seaterSeats")}
                        </div>
                      </div>
                      <div className="rounded-lg border border-sky-200 bg-sky-50/50 p-3 dark:border-sky-800 dark:bg-sky-400/10">
                        <div className="text-sm text-sky-600 dark:text-sky-400">
                          Grid
                        </div>
                        <div className="text-2xl font-bold text-sky-700 dark:text-sky-400">
                          {rowCount} × {columnCount}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-sky-500 text-sky-600 hover:bg-sky-50 hover:text-sky-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-sky-500 text-white hover:bg-sky-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Layout"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
