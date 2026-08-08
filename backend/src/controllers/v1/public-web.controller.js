const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { z } = require("zod");
const {
  loadRouteMarkup,
  applyMarkupToSchedule,
  forPublicSchedule,
  loadCharterConfig,
  applyCharterRateMarkup,
} = require("../../utils/fare-engine");

// Get all unique source and destination cities
const getCities = async (req, res) => {
  try {
    const routes = await prisma.route.findMany({
      select: {
        sourceCity: true,
        destinationCity: true,
        id: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Cities fetched successfully",
      data: routes,
    });
  } catch (error) {
    console.error("Error in getCities:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching cities",
      error: error.message,
    });
  }
};

// Get vehicle information by routeId
const getVehiclesByRouteId = async (req, res) => {
  try {
    // Validate route ID
    const routeIdSchema = z.object({
      routeId: z.string().min(1, "Route ID is required"),
    });

    // Validate query parameters
    const querySchema = z.object({
      page: z.string().optional().transform(val => parseInt(val) || 1),
      sort: z.enum(['LOW_TO_HIGH', 'HIGH_TO_LOW']).optional().default('LOW_TO_HIGH'),
    });

    const { routeId } = routeIdSchema.parse(req.params);
    const { page, sort } = querySchema.parse(req.query);

    const limit = 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const [total, vehicles] = await Promise.all([
      prisma.vehicle.count({
        where: {
          routeId,
          vehicleStatus: "AVAILABLE",
        },
      }),
      prisma.vehicle.findMany({
        where: {
          routeId,
          vehicleStatus: "AVAILABLE",
        },
        include: {
          route: {
            include: {
              boardingPoints: true,
              droppingPoints: true,
            },
          },
          layout: true,
          schedules: {
            where: {
              status: "ACTIVE",
              routeId,
            },
            orderBy: { departureTime: "asc" },
          },
          user: {
            include: {
              vendor: true,
            },
          },
          // Bookings are deliberately NOT included. `bookings: true` returned
          // every row for the vessel — passenger names, dates of birth, contact
          // email and phone — to anyone who ran a search. The seat map gets what
          // it needs from GET /bookings/vehicle/:id, which returns seat numbers
          // and nothing else.
        },
        orderBy: {
          layout: {
            seaterPrice: sort === 'LOW_TO_HIGH' ? 'asc' : 'desc',
          },
        },
        skip,
        take: limit,
      }),
    ]);

    // departureTime stores a full timestamp but only its clock time is
    // meaningful - the date component differs depending on when the schedule
    // was created. Order by time-of-day so schedules[0] is the first sailing.
    const minutesOfDay = (d) => {
      const t = new Date(d);
      return t.getUTCHours() * 60 + t.getUTCMinutes();
    };
    // Quote the PUBLIC price: the operator's fare plus Myboat's markup for this
    // route. Applied here so search, the seat picker and checkout all read the
    // same numbers off the schedule rather than each adding the markup itself.
    const markup = await loadRouteMarkup(prisma, routeId);

    vehicles.forEach((v) => {
      if (Array.isArray(v.schedules)) {
        v.schedules.sort(
          (a, b) => minutesOfDay(a.departureTime) - minutesOfDay(b.departureTime)
        );
        // Public prices out, operator base and markup withheld: those are
        // Myboat's margin, and a search response goes straight to a browser.
        v.schedules = v.schedules.map((sch) =>
          forPublicSchedule(applyMarkupToSchedule(sch, markup))
        );
      }
    });

    if (!vehicles.length) {
      return res.status(404).json({
        success: false,
        message: "No vehicles found for this route",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vehicles fetched successfully",
      data: vehicles,
      pagination: {
        total,
        page,
        limit,
        hasMore: total > skip + vehicles.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Error in getVehiclesByRouteId:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Search routes by source and destination
const searchRoutes = async (req, res) => {
  try {
    const searchSchema = z.object({
      sourceCity: z.string().min(1, "Source city is required"),
      destinationCity: z.string().min(1, "Destination city is required"),
      date: z.string().optional(),
    });

    const validatedData = searchSchema.parse(req.query);
    const { sourceCity, destinationCity, date } = validatedData;

    const routes = await prisma.route.findMany({
      where: {
        sourceCity: {
          contains: sourceCity,
          mode: 'insensitive'
        },
        destinationCity: {
          contains: destinationCity,
          mode: 'insensitive'
        },
        isActive: true,
      },
      include: {
        boardingPoints: {
          select: {
            id: true,
            name: true,
            time: true,
          },
        },
        droppingPoints: {
          select: {
            id: true,
            name: true,
            time: true,
          },
        },
        busSchedules: {
          where: date ? {
            departureDate: {
              gte: new Date(date),
              lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)),
            },
            isActive: true,
          } : {
            isActive: true,
          },
          include: {
            vehicles: {
              select: {
                id: true,
                registrationNumber: true,
                layout: {
                  select: {
                    id: true,
                    layoutName: true,
                    totalSeats: true,
                    sleeperSeats: true,
                    seaterSeats: true,
                    sleeperPrice: true,
                    seaterPrice: true,
                  },
                },
                user: {
                  select: {
                    id: true,
                    name: true,
                    vendor: {
                      select: {
                        id: true,
                        companyName: true,
                        companyLogo: true,
                        rating: true,
                        totalTrips: true,
                      }
                    }
                  }
                }
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Routes fetched successfully",
      data: routes,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Error in searchRoutes:", error);
    return res.status(500).json({
      success: false,
      message: "Error searching routes",
      error: error.message,
    });
  }
};

/* -------------------------------------------------------------------------- */
/*  Private charter search                                                     */
/* -------------------------------------------------------------------------- */

// What the customer needs to see on a result card.
const CHARTER_VESSEL_SELECT = {
  id: true,
  vehicleName: true,
  vehicleNumber: true,
  vehicleImage: true,
  images: true,
  vehicleType: true,
  baseIsland: true,
  totalSeats: true,
  hasAc: true,
  vehicleRating: true,
  amenities: true,
  charterPricingMode: true,
  charterInstantBooking: true,
  userId: true,
  charterRates: true,
};

/**
 * GET /public-web/charter-search?from&to&date&passengers
 *
 * Every vessel offered for private charter is returned — a charter boat can
 * usually sail anywhere, so a missing rate row means "ask for a quote" rather
 * than "unavailable". Vessels with a published price for this exact island
 * pair are listed first.
 */
const searchCharter = async (req, res) => {
  try {
    const { from = '', to = '', passengers } = req.query;
    const seatsNeeded = Number(passengers) || 1;

    const vessels = await prisma.vehicle.findMany({
      where: {
        serviceTypes: { array_contains: ['PRIVATE_CHARTER'] },
        vehicleStatus: { in: ['AVAILABLE', 'BOOKED'] },
        // A charter is the whole boat, so capacity has to fit the party.
        totalSeats: { gte: seatsNeeded },
      },
      select: CHARTER_VESSEL_SELECT,
      orderBy: { vehicleRating: 'desc' },
    });

    // Attach each vessel's operator without exposing userId.
    const vendors = await prisma.vendor.findMany({
      where: { userId: { in: [...new Set(vessels.map((v) => v.userId).filter(Boolean))] } },
      select: {
        id: true,
        userId: true,
        businessName: true,
        businessLogo: true,
        publicSlug: true,
        cancellationPolicy: true,
      },
    });
    const byUser = new Map(vendors.map((v) => [v.userId, v]));

    // Published charter rates are quoted at the public price, exactly as ferry
    // schedules are. The operator's own figure is kept alongside it.
    const charterCfg = await loadCharterConfig(prisma);

    const results = vessels.map(({ userId, charterRates, ...vessel }) => {
      const vendor = byUser.get(userId) || null;

      // Exact island pair only. Charter pricing is point to point, so a rate
      // for a different pair tells us nothing about this trip.
      const rate =
        from && to
          ? charterRates.find((r) => r.fromIsland === from && r.toIsland === to)
          : null;

      const livePricing =
        vessel.charterPricingMode === 'LIVE' &&
        rate &&
        !rate.quoteOnly &&
        (rate.priceMvr != null || rate.priceUsd != null);

      const priced = livePricing ? applyCharterRateMarkup(rate, charterCfg) : null;

      return {
        ...vessel,
        vendor: vendor ? { ...vendor, userId: undefined } : null,
        pricing: priced
          ? {
              mode: 'LIVE',
              priceMvr: priced.priceMvr,
              priceUsd: priced.priceUsd,
              operatorPriceMvr: priced.operatorPriceMvr,
              operatorPriceUsd: priced.operatorPriceUsd,
              instantBooking: !!vessel.charterInstantBooking,
            }
          : { mode: 'QUOTE' },
      };
    });

    // Priced options first, then by rating.
    results.sort((a, b) => {
      const rank = (r) => (r.pricing.mode === 'LIVE' ? 0 : 1);
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      return Number(b.vehicleRating || 0) - Number(a.vehicleRating || 0);
    });

    return res.json({
      success: true,
      message: 'Charter vessels retrieved',
      data: { vessels: results, count: results.length },
    });
  } catch (error) {
    console.error('searchCharter error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error searching charter vessels',
      error: error.message,
    });
  }
};

/* -------------------------------------------------------------------------- */
/*  Logistics search                                                           */
/* -------------------------------------------------------------------------- */

const LOGISTICS_VESSEL_SELECT = {
  id: true,
  vehicleName: true,
  vehicleNumber: true,
  vehicleImage: true,
  images: true,
  vehicleType: true,
  baseIsland: true,
  totalSeats: true,
  vehicleRating: true,
  capacityTons: true,
  cargoTypes: true,
  userId: true,
  logisticsRates: true,
};

/**
 * Pick the rate that applies to this trip, most specific first.
 *
 * A route rate beats an atoll rate, which beats a nationwide one — an operator
 * who priced a particular leg meant that price to win.
 */
const pickLogisticsRate = (rates, from, to, atollCodes) => {
  const exact = rates.find(
    (r) => r.coverage === 'ROUTE' && r.fromIsland === from && r.toIsland === to
  );
  if (exact) return exact;

  const atoll = rates.find(
    (r) => r.coverage === 'ATOLL' && r.atollCode && atollCodes.has(r.atollCode)
  );
  if (atoll) return atoll;

  return rates.find((r) => r.coverage === 'NATIONWIDE') || null;
};

/**
 * GET /public/logistics-search?from&to&date&cargoType&tons
 *
 * Like charter search, an unpriced trip is a quote rather than a dead end.
 * Capacity and cargo type do filter, because a boat that physically cannot
 * carry the load is not a result.
 */
const searchLogistics = async (req, res) => {
  try {
    const { from = '', to = '', cargoType = '' } = req.query;
    const tons = Number(req.query.tons) > 0 ? Number(req.query.tons) : null;

    const vessels = await prisma.vehicle.findMany({
      where: {
        serviceTypes: { array_contains: ['LOGISTICS'] },
        vehicleStatus: { in: ['AVAILABLE', 'BOOKED'] },
      },
      select: LOGISTICS_VESSEL_SELECT,
      orderBy: { vehicleRating: 'desc' },
    });

    // Which atolls this trip touches, so ATOLL rates can be matched.
    const atollCodes = new Set();
    const labels = [from, to].filter(Boolean);
    if (labels.length) {
      const islands = await prisma.island.findMany({
        where: { label: { in: labels } },
        select: { atollCode: true },
      });
      islands.forEach((i) => atollCodes.add(i.atollCode));
    }

    const vendors = await prisma.vendor.findMany({
      where: { userId: { in: [...new Set(vessels.map((v) => v.userId).filter(Boolean))] } },
      select: {
        id: true,
        userId: true,
        businessName: true,
        businessLogo: true,
        publicSlug: true,
      },
    });
    const byUser = new Map(vendors.map((v) => [v.userId, v]));

    const results = [];

    for (const { userId, logisticsRates, ...vessel } of vessels) {
      // A boat that can't take the load isn't an option.
      if (tons && vessel.capacityTons != null && Number(vessel.capacityTons) < tons) {
        continue;
      }
      // An empty cargo list means "no restriction stated"; a populated one filters.
      const accepted = Array.isArray(vessel.cargoTypes) ? vessel.cargoTypes : [];
      if (cargoType && accepted.length && !accepted.includes(cargoType)) {
        continue;
      }

      const rate = pickLogisticsRate(logisticsRates, from, to, atollCodes);
      const priced =
        rate && !rate.quoteOnly && (rate.priceMvr != null || rate.priceUsd != null);

      let pricing = { mode: 'QUOTE' };
      if (priced) {
        const perTon = rate.basis === 'PER_TON';
        // A per-ton rate needs a weight to become a total; without one we show
        // the unit price instead of inventing a number.
        const multiplier = perTon ? tons : 1;
        pricing = {
          mode: 'LIVE',
          basis: rate.basis,
          coverage: rate.coverage,
          tons: tons,
          unitMvr: rate.priceMvr,
          unitUsd: rate.priceUsd,
          totalMvr:
            rate.priceMvr != null && multiplier != null
              ? Number(rate.priceMvr) * multiplier
              : null,
          totalUsd:
            rate.priceUsd != null && multiplier != null
              ? Number(rate.priceUsd) * multiplier
              : null,
        };
      }

      const vendor = byUser.get(userId) || null;
      results.push({
        ...vessel,
        vendor: vendor ? { ...vendor, userId: undefined } : null,
        pricing,
      });
    }

    results.sort((a, b) => {
      const rank = (r) => (r.pricing.mode === 'LIVE' ? 0 : 1);
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      return Number(b.vehicleRating || 0) - Number(a.vehicleRating || 0);
    });

    return res.json({
      success: true,
      message: 'Logistics vessels retrieved',
      data: { vessels: results, count: results.length },
    });
  } catch (error) {
    console.error('searchLogistics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error searching logistics vessels',
      error: error.message,
    });
  }
};

module.exports = {
  getCities,
  searchRoutes,
  getVehiclesByRouteId,
  searchCharter,
  searchLogistics,
};
