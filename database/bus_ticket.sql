/*
 Navicat Premium Dump SQL

 Source Server         : neon_bus
 Source Server Type    : PostgreSQL
 Source Server Version : 170004 (170004)
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 170004 (170004)
 File Encoding         : 65001

 Date: 04/04/2025 10:54:06
*/


-- ----------------------------
-- Type structure for BookingStatus
-- ----------------------------
DROP TYPE IF EXISTS "bus_ticket"."BookingStatus";
CREATE TYPE "bus_ticket"."BookingStatus" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'CANCELLED'
);
ALTER TYPE "bus_ticket"."BookingStatus" OWNER TO "neondb_owner";

-- ----------------------------
-- Type structure for BusType
-- ----------------------------
DROP TYPE IF EXISTS "bus_ticket"."BusType";
CREATE TYPE "bus_ticket"."BusType" AS ENUM (
  'AC_SLEEPER',
  'NON_AC_SLEEPER',
  'AC_SEATER'
);
ALTER TYPE "bus_ticket"."BusType" OWNER TO "neondb_owner";

-- ----------------------------
-- Type structure for CategoryType
-- ----------------------------
DROP TYPE IF EXISTS "bus_ticket"."CategoryType";
CREATE TYPE "bus_ticket"."CategoryType" AS ENUM (
  'INCOME',
  'EXPENSE'
);
ALTER TYPE "bus_ticket"."CategoryType" OWNER TO "neondb_owner";

-- ----------------------------
-- Type structure for DriverVehicleAssignedStatus
-- ----------------------------
DROP TYPE IF EXISTS "bus_ticket"."DriverVehicleAssignedStatus";
CREATE TYPE "bus_ticket"."DriverVehicleAssignedStatus" AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'COMPLETED'
);
ALTER TYPE "bus_ticket"."DriverVehicleAssignedStatus" OWNER TO "neondb_owner";

-- ----------------------------
-- Type structure for DrivingStatus
-- ----------------------------
DROP TYPE IF EXISTS "bus_ticket"."DrivingStatus";
CREATE TYPE "bus_ticket"."DrivingStatus" AS ENUM (
  'AVAILABLE',
  'ON_TRIP',
  'OFF_DUTY'
);
ALTER TYPE "bus_ticket"."DrivingStatus" OWNER TO "neondb_owner";

-- ----------------------------
-- Type structure for FuelType
-- ----------------------------
DROP TYPE IF EXISTS "bus_ticket"."FuelType";
CREATE TYPE "bus_ticket"."FuelType" AS ENUM (
  'PETROL',
  'DIESEL',
  'ELECTRIC',
  'HYBRID',
  'CNG'
);
ALTER TYPE "bus_ticket"."FuelType" OWNER TO "neondb_owner";

-- ----------------------------
-- Type structure for GearSystem
-- ----------------------------
DROP TYPE IF EXISTS "bus_ticket"."GearSystem";
CREATE TYPE "bus_ticket"."GearSystem" AS ENUM (
  'MANUAL',
  'AUTOMATIC',
  'SEMI_AUTOMATIC'
);
ALTER TYPE "bus_ticket"."GearSystem" OWNER TO "neondb_owner";

-- ----------------------------
-- Type structure for ScheduleStatus
-- ----------------------------
DROP TYPE IF EXISTS "bus_ticket"."ScheduleStatus";
CREATE TYPE "bus_ticket"."ScheduleStatus" AS ENUM (
  'ACTIVE',
  'CANCELLED',
  'COMPLETED'
);
ALTER TYPE "bus_ticket"."ScheduleStatus" OWNER TO "neondb_owner";

-- ----------------------------
-- Type structure for SettingType
-- ----------------------------
DROP TYPE IF EXISTS "bus_ticket"."SettingType";
CREATE TYPE "bus_ticket"."SettingType" AS ENUM (
  'TEXT',
  'IMAGE',
  'JSON',
  'BOOLEAN',
  'NUMBER'
);
ALTER TYPE "bus_ticket"."SettingType" OWNER TO "neondb_owner";

-- ----------------------------
-- Type structure for UserRole
-- ----------------------------
DROP TYPE IF EXISTS "bus_ticket"."UserRole";
CREATE TYPE "bus_ticket"."UserRole" AS ENUM (
  'USER',
  'VENDOR',
  'ADMIN',
  'DRIVER'
);
ALTER TYPE "bus_ticket"."UserRole" OWNER TO "neondb_owner";

-- ----------------------------
-- Type structure for VehicleStatus
-- ----------------------------
DROP TYPE IF EXISTS "bus_ticket"."VehicleStatus";
CREATE TYPE "bus_ticket"."VehicleStatus" AS ENUM (
  'AVAILABLE',
  'BOOKED',
  'MAINTENANCE',
  'INACTIVE'
);
ALTER TYPE "bus_ticket"."VehicleStatus" OWNER TO "neondb_owner";

-- ----------------------------
-- Type structure for VendorStatus
-- ----------------------------
DROP TYPE IF EXISTS "bus_ticket"."VendorStatus";
CREATE TYPE "bus_ticket"."VendorStatus" AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED'
);
ALTER TYPE "bus_ticket"."VendorStatus" OWNER TO "neondb_owner";

-- ----------------------------
-- Table structure for _ScheduleVehicles
-- ----------------------------
DROP TABLE IF EXISTS "bus_ticket"."_ScheduleVehicles";
CREATE TABLE "bus_ticket"."_ScheduleVehicles" (
  "A" text COLLATE "pg_catalog"."default" NOT NULL,
  "B" text COLLATE "pg_catalog"."default" NOT NULL
)
;
ALTER TABLE "bus_ticket"."_ScheduleVehicles" OWNER TO "neondb_owner";

-- ----------------------------
-- Records of _ScheduleVehicles
-- ----------------------------
BEGIN;
INSERT INTO "bus_ticket"."_ScheduleVehicles" ("A", "B") VALUES ('cm7in1okq0001btboqfbj4n6a', 'cm7ekmofl0001dt8h1r1lien5');
COMMIT;

-- ----------------------------
-- Table structure for _prisma_migrations
-- ----------------------------
DROP TABLE IF EXISTS "bus_ticket"."_prisma_migrations";
CREATE TABLE "bus_ticket"."_prisma_migrations" (
  "id" varchar(36) COLLATE "pg_catalog"."default" NOT NULL,
  "checksum" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "finished_at" timestamptz(6),
  "migration_name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "logs" text COLLATE "pg_catalog"."default",
  "rolled_back_at" timestamptz(6),
  "started_at" timestamptz(6) NOT NULL DEFAULT now(),
  "applied_steps_count" int4 NOT NULL DEFAULT 0
)
;
ALTER TABLE "bus_ticket"."_prisma_migrations" OWNER TO "neondb_owner";

-- ----------------------------
-- Records of _prisma_migrations
-- ----------------------------
BEGIN;
INSERT INTO "bus_ticket"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('b7cdacf9-e91f-4f5d-bf5f-1af737a11aaf', '453f2a381ee00c5f0d914ecda530c22a9440499c08646e7214cd45cdc3e7e070', '2025-02-23 09:07:37.52884+00', '20250223090734_add_new_table_driver_vehicle_assigned_model_update', NULL, NULL, '2025-02-23 09:07:36.075917+00', 1);
INSERT INTO "bus_ticket"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('e9008317-b734-444c-8df6-9f0b59c7e2a3', '79787792d95e2a4545ff47784c402ee18e55823e50bc854e65269e8f1610d768', '2025-02-16 17:49:37.978046+00', '20250216174935_init', NULL, NULL, '2025-02-16 17:49:36.49291+00', 1);
INSERT INTO "bus_ticket"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('a2ffeea0-f0f7-4aac-bf4a-c96d5d508be1', '3913bc61e0b506b65e29e075daab2e2fbfc2b24db3b8669239183cf2129afab3', '2025-02-17 17:33:32.924082+00', '20250217173330_add_is_active_to_route', NULL, NULL, '2025-02-17 17:33:31.453577+00', 1);
INSERT INTO "bus_ticket"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('b8483d1d-00ed-45db-bf53-538c11cdf127', 'f2c2e3813331c0fd096b7087d617b82c76dafc75418cfd5217d9499dc1cb9d8a', '2025-02-18 07:19:05.715923+00', '20250218071902_update_vendor_model', NULL, NULL, '2025-02-18 07:19:04.220059+00', 1);
INSERT INTO "bus_ticket"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('030454ef-791c-4b11-9130-6b71d8438e37', '692a61aaba7ccb31f52381bbcbd801c77349db33026b4687a94928ba581b47dc', '2025-02-27 08:56:46.959701+00', '20250227085644_update_booking_model', NULL, NULL, '2025-02-27 08:56:45.455755+00', 1);
INSERT INTO "bus_ticket"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('62264779-6f9d-488d-96f0-230fac52a6e8', 'fd54054ce5f8bcd25fb1afd5558108a7df031f73bce130e6d2676d679d201ac7', '2025-02-18 17:10:42.147644+00', '20250218171039_update_bus_schedule_model', NULL, NULL, '2025-02-18 17:10:40.638047+00', 1);
INSERT INTO "bus_ticket"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('62c8b51b-426f-4330-b20c-69d9cbcdd5fd', 'ac53dd342cad96f0337ca5a80a9d0cc8e4d7df8be157e43244d08c44da0c961a', '2025-02-19 05:12:19.671764+00', '20250219051216_add_is_active_to_bus_layout', NULL, NULL, '2025-02-19 05:12:18.317918+00', 1);
INSERT INTO "bus_ticket"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('697538b1-219d-47f3-be9e-5639debbe654', '982e5171c8ebcc1c89071e9d1a436e41b87e1123414d42ea1f80079139f00987', '2025-02-19 06:42:59.91486+00', '20250219064257_update_vehicle_model', NULL, NULL, '2025-02-19 06:42:58.512414+00', 1);
INSERT INTO "bus_ticket"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('151446c8-85a5-4009-9a06-29a441612ed6', '9083b78a7363481addebe2d3b0dd358d1281cd6902d515926adaa3220d5f5029', '2025-02-27 09:39:03.388738+00', '20250227093858_update_booking_model_fields', NULL, NULL, '2025-02-27 09:39:01.650473+00', 1);
INSERT INTO "bus_ticket"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('c1e5cb67-17a0-4b47-a43f-82eeeb0da39a', '4e8fc37712a96bc6e943dfe5e79f18142979ef3abeb63246fa16ffa465e6232e', '2025-02-21 05:17:07.493884+00', '20250221051704_add_amenities_model', NULL, NULL, '2025-02-21 05:17:06.090821+00', 1);
INSERT INTO "bus_ticket"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('c032eb49-c1e0-42e5-b3bf-dd0d96af48f5', 'a6b6332761919682531f46643fd7465168dde95b9529407f2334f7498b9f961b', '2025-02-21 10:53:43.792953+00', '20250221105340_create_income_expenses', NULL, NULL, '2025-02-21 10:53:42.41343+00', 1);
INSERT INTO "bus_ticket"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('33257cb9-c75f-4b62-a9b4-dca6e84a9e64', 'd42df3d305669bde457e135a8bcc65e4c93b5c5c6c23c2537db34b4a93b872d5', '2025-02-22 07:25:15.545771+00', '20250222072512_add_driver_model', NULL, NULL, '2025-02-22 07:25:14.138693+00', 1);
INSERT INTO "bus_ticket"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('94452450-0666-4fc4-a0e1-1c313d223b07', '4db5a84b0ce69da04bf6e94b4ef48670f33dee56250340645a6b85737f09e4b0', '2025-03-01 07:44:50.827146+00', '20250301074447_update_booking_model_fields_payments', NULL, NULL, '2025-03-01 07:44:49.439865+00', 1);
INSERT INTO "bus_ticket"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('bd9a1836-56e9-4287-a17c-fcaf44c29cd9', '18af6f004486aa234aa9741e84b2a5a6cf39b515e9f1651f00d623c8d0e14e3c', '2025-02-22 08:28:50.523677+00', '20250222082847_add_driver_mode_add_new_fields', NULL, NULL, '2025-02-22 08:28:49.159701+00', 1);
INSERT INTO "bus_ticket"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('525054f8-a280-421a-98fd-37da8e67b010', '9777d72d5a6eb3f14a646b558b5d4f96980d929f8211f4a91ba83f8453b923a4', '2025-02-22 10:06:56.090267+00', '20250222100652_add_driver_mode_add_new_driving_status', NULL, NULL, '2025-02-22 10:06:53.569856+00', 1);
INSERT INTO "bus_ticket"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('cfbc1307-88de-47d3-bac3-c6cff6e8fda4', '96f080f4e6a4e12528421742709f4275f5cc7cb4ca0f12f0f80b79e72258fb4d', '2025-02-23 05:41:31.06585+00', '20250223054128_add_new_table_driver_vehicle_assigned', NULL, NULL, '2025-02-23 05:41:29.498263+00', 1);
INSERT INTO "bus_ticket"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('e5a132a8-ffba-4b41-9abe-6b28c9fc7b2b', '5f7aea345b219f2050c367ed8f3392d62895ce84076c15588faa116fd4f5798b', '2025-03-11 11:15:51.536878+00', '20250311111548_update_custom_field', NULL, NULL, '2025-03-11 11:15:50.023533+00', 1);
INSERT INTO "bus_ticket"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('7a44744b-8be2-4b4b-8714-1dda44fdb2f8', 'd5057f8b786fa62387a2a0bfdc014e5a8bae9dea3d84c0c543980a5dcb5b1ccc', '2025-03-14 09:43:08.646222+00', '20250314094304_setting_type_add_image', NULL, NULL, '2025-03-14 09:43:06.439814+00', 1);
INSERT INTO "bus_ticket"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('9be1f3e8-f02c-4c73-824a-b49941589938', '804e4fba2554162ab32f7f522c77a54ac28c3923c3398f1e9673d2f33db6c5c5', '2025-03-30 07:13:25.125983+00', '20250330071322_vendor_user_key_changed', NULL, NULL, '2025-03-30 07:13:23.547864+00', 1);
COMMIT;

-- ----------------------------
-- Table structure for amenities
-- ----------------------------
DROP TABLE IF EXISTS "bus_ticket"."amenities";
CREATE TABLE "bus_ticket"."amenities" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "name" text COLLATE "pg_catalog"."default" NOT NULL,
  "icon" text COLLATE "pg_catalog"."default" NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL
)
;
ALTER TABLE "bus_ticket"."amenities" OWNER TO "neondb_owner";

-- ----------------------------
-- Records of amenities
-- ----------------------------
BEGIN;
INSERT INTO "bus_ticket"."amenities" ("id", "name", "icon", "created_at", "updated_at") VALUES ('cm7ec92q50000caboh1vuo39d', 'WiFi', 'icon-1740116189879-212774413.png', '2025-02-21 05:36:31.758', '2025-02-21 05:36:31.758');
INSERT INTO "bus_ticket"."amenities" ("id", "name", "icon", "created_at", "updated_at") VALUES ('cm7ecthof000011tcme6qq6aw', 'AC', 'icon-1740117141662-997552270.png', '2025-02-21 05:52:21.669', '2025-02-21 05:52:21.669');
INSERT INTO "bus_ticket"."amenities" ("id", "name", "icon", "created_at", "updated_at") VALUES ('cm843gwv3000013jab14yr5sd', 'TV', 'icon-1741673561165-378141118.png', '2025-03-11 06:12:41.174', '2025-03-11 06:12:41.174');
INSERT INTO "bus_ticket"."amenities" ("id", "name", "icon", "created_at", "updated_at") VALUES ('cm7hk0x780004j4hk5rlb244s', 'Just', 'icon-1741673629101-549824274.png', '2025-02-23 11:37:26.539', '2025-03-11 06:13:52.32');
COMMIT;

-- ----------------------------
-- Table structure for boarding_points
-- ----------------------------
DROP TABLE IF EXISTS "bus_ticket"."boarding_points";
CREATE TABLE "bus_ticket"."boarding_points" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "route_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "location_name" text COLLATE "pg_catalog"."default" NOT NULL,
  "arrival_time" timestamp(3),
  "sequence_number" int4,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL
)
;
ALTER TABLE "bus_ticket"."boarding_points" OWNER TO "neondb_owner";

-- ----------------------------
-- Records of boarding_points
-- ----------------------------
BEGIN;
INSERT INTO "bus_ticket"."boarding_points" ("id", "route_id", "location_name", "arrival_time", "sequence_number", "created_at", "updated_at") VALUES ('cm7lfybgy000179yp88dcu20z', 'cm7lfybgw000079ypigypsxj3', 'Port Authority Bus Terminal', '2025-02-25 18:52:00', 1, '2025-02-26 04:54:29.527', '2025-02-26 04:54:29.527');
INSERT INTO "bus_ticket"."boarding_points" ("id", "route_id", "location_name", "arrival_time", "sequence_number", "created_at", "updated_at") VALUES ('cm7lfybgy000279ypzroza8v3', 'cm7lfybgw000079ypigypsxj3', 'Newark Penn Station', '2025-02-26 04:56:00', 2, '2025-02-26 04:54:29.527', '2025-02-26 04:54:29.527');
INSERT INTO "bus_ticket"."boarding_points" ("id", "route_id", "location_name", "arrival_time", "sequence_number", "created_at", "updated_at") VALUES ('cm7lg0yi5000579yp1g5w3y1f', 'cm7lg0yi3000479yp1f7yos3y', 'Union Station LA', '2025-02-26 04:58:00', 1, '2025-02-26 04:56:34.469', '2025-02-26 04:56:34.469');
INSERT INTO "bus_ticket"."boarding_points" ("id", "route_id", "location_name", "arrival_time", "sequence_number", "created_at", "updated_at") VALUES ('cm7lg0yi5000679ypy7bvytes', 'cm7lg0yi3000479yp1f7yos3y', 'Chicago Greyhound Station', '2025-02-25 20:56:00', 2, '2025-02-26 04:56:34.469', '2025-02-26 04:56:34.469');
INSERT INTO "bus_ticket"."boarding_points" ("id", "route_id", "location_name", "arrival_time", "sequence_number", "created_at", "updated_at") VALUES ('cm81h09xv000813gbmsg4bceg', 'cm79c5uuw00009sjdos30r9w2', 'Bording', '2025-03-09 11:08:00', 1, '2025-03-09 10:08:21.064', '2025-03-09 10:08:21.064');
INSERT INTO "bus_ticket"."boarding_points" ("id", "route_id", "location_name", "arrival_time", "sequence_number", "created_at", "updated_at") VALUES ('cm81h830j000a13gbj0jysrdc', 'cm81gneyp000113gb89wjlxxf', 'Uttara', '2025-03-09 09:48:00', 1, '2025-03-09 10:14:25.297', '2025-03-09 10:14:25.297');
INSERT INTO "bus_ticket"."boarding_points" ("id", "route_id", "location_name", "arrival_time", "sequence_number", "created_at", "updated_at") VALUES ('cm81h830j000b13gbdikifhdj', 'cm81gneyp000113gb89wjlxxf', 'Mohakhali', '2025-03-09 09:52:00', 2, '2025-03-09 10:14:25.297', '2025-03-09 10:14:25.297');
INSERT INTO "bus_ticket"."boarding_points" ("id", "route_id", "location_name", "arrival_time", "sequence_number", "created_at", "updated_at") VALUES ('cm81h830j000c13gb3cv12hlg', 'cm81gneyp000113gb89wjlxxf', 'Jatrabari', '2025-03-09 09:58:00', 3, '2025-03-09 10:14:25.297', '2025-03-09 10:14:25.297');
COMMIT;

-- ----------------------------
-- Table structure for bookings
-- ----------------------------
DROP TABLE IF EXISTS "bus_ticket"."bookings";
CREATE TABLE "bus_ticket"."bookings" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "user_id" text COLLATE "pg_catalog"."default",
  "vendor_id" text COLLATE "pg_catalog"."default",
  "vehicle_id" text COLLATE "pg_catalog"."default",
  "route_id" text COLLATE "pg_catalog"."default",
  "boarding_point_id" text COLLATE "pg_catalog"."default",
  "dropping_point_id" text COLLATE "pg_catalog"."default",
  "booking_date" timestamp(3),
  "total_amount" numeric(10,2) NOT NULL,
  "discount_amount" numeric(10,2) NOT NULL DEFAULT 0,
  "final_amount" numeric(10,2) NOT NULL,
  "payment_method" text COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'CASH'::text,
  "status" "bus_ticket"."BookingStatus" NOT NULL DEFAULT 'CONFIRMED'::"BookingStatus",
  "cancellation_reason" text COLLATE "pg_catalog"."default",
  "cancellation_charge" numeric(10,2),
  "refund_amount" numeric(10,2),
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  "payment_intent_id" text COLLATE "pg_catalog"."default",
  "payment_status" text COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'PENDING'::text,
  "seat_numbers" jsonb
)
;
ALTER TABLE "bus_ticket"."bookings" OWNER TO "neondb_owner";

-- ----------------------------
-- Records of bookings
-- ----------------------------
BEGIN;
INSERT INTO "bus_ticket"."bookings" ("id", "user_id", "vendor_id", "vehicle_id", "route_id", "boarding_point_id", "dropping_point_id", "booking_date", "total_amount", "discount_amount", "final_amount", "payment_method", "status", "cancellation_reason", "cancellation_charge", "refund_amount", "created_at", "updated_at", "payment_intent_id", "payment_status", "seat_numbers") VALUES ('cm8vc2bhr0007s7m6mfhjxoiq', 'cm78xeqfh0000qp7yvrqc1521', 'cm7a679lf0000gbx1zxk35fxi', 'cm89vkh62000514gi3ut989kb', 'cm7lg0yi3000479yp1f7yos3y', 'cm7lg0yi5000579yp1g5w3y1f', 'cm7lg0yi5000779yp8yymvhmi', '2025-03-30 00:00:00', 100.00, 0.00, 100.00, 'STRIPE', 'CONFIRMED', NULL, NULL, NULL, '2025-03-30 07:43:01.867', '2025-03-30 07:43:01.867', 'pi_3R8GVlBF7yQV6OLH1if1VZRw', 'PAID', '[{"key": "lower-0-0", "type": "SEAT", "price": 100}]');
INSERT INTO "bus_ticket"."bookings" ("id", "user_id", "vendor_id", "vehicle_id", "route_id", "boarding_point_id", "dropping_point_id", "booking_date", "total_amount", "discount_amount", "final_amount", "payment_method", "status", "cancellation_reason", "cancellation_charge", "refund_amount", "created_at", "updated_at", "payment_intent_id", "payment_status", "seat_numbers") VALUES ('cm8vdajjc000188j9g2ccafe1', 'cm78xeqfh0000qp7yvrqc1521', 'cm7lgjeye000c79ypy9rbvg09', 'cm7lguj6x000g79ypxurxt7ml', 'cm7lg0yi3000479yp1f7yos3y', 'cm7lg0yi5000679ypy7bvytes', 'cm7lg0yi5000779yp8yymvhmi', '2025-04-05 00:00:00', 200.00, 0.00, 200.00, 'STRIPE', 'CANCELLED', 'Cancelled by admin', NULL, NULL, '2025-03-30 08:17:26.837', '2025-03-30 08:33:28.142', 'pi_3R8H3BBF7yQV6OLH0tGphFqV', 'PAID', '[{"key": "lower-0-1", "type": "SEAT", "price": 100}, {"key": "lower-2-0", "type": "SEAT", "price": 100}]');
INSERT INTO "bus_ticket"."bookings" ("id", "user_id", "vendor_id", "vehicle_id", "route_id", "boarding_point_id", "dropping_point_id", "booking_date", "total_amount", "discount_amount", "final_amount", "payment_method", "status", "cancellation_reason", "cancellation_charge", "refund_amount", "created_at", "updated_at", "payment_intent_id", "payment_status", "seat_numbers") VALUES ('cm8y1vpsf0003trsjevnah3kn', 'cm78xeqfh0000qp7yvrqc1521', 'cm7a679lf0000gbx1zxk35fxi', 'cm7lijrwb00059bpgq11946co', 'cm7lg0yi3000479yp1f7yos3y', 'cm7lg0yi5000679ypy7bvytes', 'cm7lg0yi5000779yp8yymvhmi', '2025-04-01 05:21:17.501', 250.00, 0.00, 250.00, 'CASH', 'PENDING', NULL, NULL, NULL, '2025-04-01 05:21:17.879', '2025-04-01 05:21:17.879', NULL, 'PENDING', '[{"key": "lower-0-1", "deck": "LOWER", "type": "SLEEPER", "price": 250, "seatNumber": "SEAT-0"}]');
COMMIT;

-- ----------------------------
-- Table structure for bus_layouts
-- ----------------------------
DROP TABLE IF EXISTS "bus_ticket"."bus_layouts";
CREATE TABLE "bus_ticket"."bus_layouts" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "layout_name" text COLLATE "pg_catalog"."default",
  "total_seats" int4 NOT NULL,
  "sleeper_seats" int4 NOT NULL,
  "seater_seats" int4 NOT NULL,
  "has_upper_deck" bool NOT NULL DEFAULT false,
  "upper_deck_seats" int4 NOT NULL DEFAULT 0,
  "sleeper_price" numeric(10,2) NOT NULL,
  "seater_price" numeric(10,2) NOT NULL,
  "row_count" int4 NOT NULL,
  "column_count" int4 NOT NULL,
  "layout_json" jsonb NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "user_id" text COLLATE "pg_catalog"."default",
  "is_active" bool NOT NULL DEFAULT true
)
;
ALTER TABLE "bus_ticket"."bus_layouts" OWNER TO "neondb_owner";

-- ----------------------------
-- Records of bus_layouts
-- ----------------------------
BEGIN;
INSERT INTO "bus_ticket"."bus_layouts" ("id", "layout_name", "total_seats", "sleeper_seats", "seater_seats", "has_upper_deck", "upper_deck_seats", "sleeper_price", "seater_price", "row_count", "column_count", "layout_json", "created_at", "user_id", "is_active") VALUES ('cm7bgjwv50000bgurns6jxzn8', 'dgsfg', 18, 9, 9, 't', 9, 454.00, 454.00, 3, 3, '{"rows": [["SEAT", "SEAT", "SEAT"], ["SEAT", "SEAT", "SEAT"], ["SLEEPER", "SLEEPER", "SLEEPER"], ["SLEEPER", "SLEEPER", "SLEEPER"], ["SLEEPER", "SLEEPER", "SLEEPER"], ["SEAT", "SEAT", "SEAT"]], "seats": {"lower-0-0": {"deck": "LOWER", "type": "SEAT", "number": "LS01"}, "lower-0-1": {"deck": "LOWER", "type": "SEAT", "number": "LS02"}, "lower-0-2": {"deck": "LOWER", "type": "SEAT", "number": "LS03"}, "lower-1-0": {"deck": "LOWER", "type": "SEAT", "number": "LS06"}, "lower-1-1": {"deck": "LOWER", "type": "SEAT", "number": "LS05"}, "lower-1-2": {"deck": "LOWER", "type": "SEAT", "number": "LS04"}, "lower-2-0": {"deck": "LOWER", "type": "SLEEPER", "number": "LB01"}, "lower-2-1": {"deck": "LOWER", "type": "SLEEPER", "number": "LB02"}, "lower-2-2": {"deck": "LOWER", "type": "SLEEPER", "number": "LB03"}, "upper-0-0": {"deck": "UPPER", "type": "SLEEPER", "number": "UB03"}, "upper-0-1": {"deck": "UPPER", "type": "SLEEPER", "number": "UB02"}, "upper-0-2": {"deck": "UPPER", "type": "SLEEPER", "number": "UB01"}, "upper-1-0": {"deck": "UPPER", "type": "SLEEPER", "number": "UB04"}, "upper-1-1": {"deck": "UPPER", "type": "SLEEPER", "number": "UB05"}, "upper-1-2": {"deck": "UPPER", "type": "SLEEPER", "number": "UB06"}, "upper-2-0": {"deck": "UPPER", "type": "SEAT", "number": "US03"}, "upper-2-1": {"deck": "UPPER", "type": "SEAT", "number": "US02"}, "upper-2-2": {"deck": "UPPER", "type": "SEAT", "number": "US01"}}}', '2025-02-19 05:13:37.313', 'cm78y6zu00001qp7yd8i4ovsz', 't');
INSERT INTO "bus_ticket"."bus_layouts" ("id", "layout_name", "total_seats", "sleeper_seats", "seater_seats", "has_upper_deck", "upper_deck_seats", "sleeper_price", "seater_price", "row_count", "column_count", "layout_json", "created_at", "user_id", "is_active") VALUES ('cm7lg7yqo000879yp3ltnvb20', '12-bus-seats', 12, 0, 12, 'f', 0, 200.00, 100.00, 3, 4, '{"rows": [["SEAT", "SEAT", "SEAT", "SEAT"], ["SEAT", "SEAT", "SEAT", "SEAT"], ["SEAT", "SEAT", "SEAT", "SEAT"]], "seats": {"lower-0-0": {"deck": "LOWER", "type": "SEAT", "number": "LS01"}, "lower-0-1": {"deck": "LOWER", "type": "SEAT", "number": "LS02"}, "lower-0-2": {"deck": "LOWER", "type": "SEAT", "number": "LS03"}, "lower-0-3": {"deck": "LOWER", "type": "SEAT", "number": "LS04"}, "lower-1-0": {"deck": "LOWER", "type": "SEAT", "number": "LS11"}, "lower-1-1": {"deck": "LOWER", "type": "SEAT", "number": "LS09"}, "lower-1-2": {"deck": "LOWER", "type": "SEAT", "number": "LS07"}, "lower-1-3": {"deck": "LOWER", "type": "SEAT", "number": "LS05"}, "lower-2-0": {"deck": "LOWER", "type": "SEAT", "number": "LS12"}, "lower-2-1": {"deck": "LOWER", "type": "SEAT", "number": "LS10"}, "lower-2-2": {"deck": "LOWER", "type": "SEAT", "number": "LS08"}, "lower-2-3": {"deck": "LOWER", "type": "SEAT", "number": "LS06"}}}', '2025-02-26 05:02:01.29', 'cm78y6zu00001qp7yd8i4ovsz', 't');
INSERT INTO "bus_ticket"."bus_layouts" ("id", "layout_name", "total_seats", "sleeper_seats", "seater_seats", "has_upper_deck", "upper_deck_seats", "sleeper_price", "seater_price", "row_count", "column_count", "layout_json", "created_at", "user_id", "is_active") VALUES ('cm7lgai8h000979yp1xrev62a', '20-bus-seats', 20, 10, 10, 't', 10, 300.00, 200.00, 5, 2, '{"rows": [["SEAT", "SEAT"], ["SEAT", "SEAT"], ["SEAT", "SEAT"], ["SEAT", "SEAT"], ["SEAT", "SEAT"], ["SLEEPER", "SLEEPER"], ["SLEEPER", "SLEEPER"], ["SLEEPER", "SLEEPER"], ["SLEEPER", "SLEEPER"], ["SLEEPER", "SLEEPER"]], "seats": {"lower-0-0": {"deck": "LOWER", "type": "SEAT", "number": "LS01"}, "lower-0-1": {"deck": "LOWER", "type": "SEAT", "number": "LS02"}, "lower-1-0": {"deck": "LOWER", "type": "SEAT", "number": "LS04"}, "lower-1-1": {"deck": "LOWER", "type": "SEAT", "number": "LS03"}, "lower-2-0": {"deck": "LOWER", "type": "SEAT", "number": "LS08"}, "lower-2-1": {"deck": "LOWER", "type": "SEAT", "number": "LS05"}, "lower-3-0": {"deck": "LOWER", "type": "SEAT", "number": "LS09"}, "lower-3-1": {"deck": "LOWER", "type": "SEAT", "number": "LS06"}, "lower-4-0": {"deck": "LOWER", "type": "SEAT", "number": "LS10"}, "lower-4-1": {"deck": "LOWER", "type": "SEAT", "number": "LS07"}, "upper-0-0": {"deck": "UPPER", "type": "SLEEPER", "number": "UB01"}, "upper-0-1": {"deck": "UPPER", "type": "SLEEPER", "number": "UB02"}, "upper-1-0": {"deck": "UPPER", "type": "SLEEPER", "number": "UB10"}, "upper-1-1": {"deck": "UPPER", "type": "SLEEPER", "number": "UB03"}, "upper-2-0": {"deck": "UPPER", "type": "SLEEPER", "number": "UB09"}, "upper-2-1": {"deck": "UPPER", "type": "SLEEPER", "number": "UB04"}, "upper-3-0": {"deck": "UPPER", "type": "SLEEPER", "number": "UB08"}, "upper-3-1": {"deck": "UPPER", "type": "SLEEPER", "number": "UB05"}, "upper-4-0": {"deck": "UPPER", "type": "SLEEPER", "number": "UB07"}, "upper-4-1": {"deck": "UPPER", "type": "SLEEPER", "number": "UB06"}}}', '2025-02-26 05:03:58.321', 'cm78y6zu00001qp7yd8i4ovsz', 't');
INSERT INTO "bus_ticket"."bus_layouts" ("id", "layout_name", "total_seats", "sleeper_seats", "seater_seats", "has_upper_deck", "upper_deck_seats", "sleeper_price", "seater_price", "row_count", "column_count", "layout_json", "created_at", "user_id", "is_active") VALUES ('cm7lgczjd000a79ypojsiqjuj', '18-bus-seats', 16, 8, 8, 't', 8, 250.00, 150.00, 4, 2, '{"rows": [["SEAT", "SLEEPER"], ["SEAT", "SLEEPER"], ["SEAT", "SLEEPER"], ["SEAT", "SLEEPER"], ["SLEEPER", "SEAT"], ["SLEEPER", "SEAT"], ["SLEEPER", "SEAT"], ["SLEEPER", "SEAT"]], "seats": {"lower-0-0": {"deck": "LOWER", "type": "SEAT", "number": "LS01"}, "lower-0-1": {"deck": "LOWER", "type": "SLEEPER", "number": "LB01"}, "lower-1-0": {"deck": "LOWER", "type": "SEAT", "number": "LS02"}, "lower-1-1": {"deck": "LOWER", "type": "SLEEPER", "number": "LB02"}, "lower-2-0": {"deck": "LOWER", "type": "SEAT", "number": "LS03"}, "lower-2-1": {"deck": "LOWER", "type": "SLEEPER", "number": "LB03"}, "lower-3-0": {"deck": "LOWER", "type": "SEAT", "number": "LS04"}, "lower-3-1": {"deck": "LOWER", "type": "SLEEPER", "number": "LB04"}, "upper-0-0": {"deck": "UPPER", "type": "SLEEPER", "number": "UB01"}, "upper-0-1": {"deck": "UPPER", "type": "SEAT", "number": "US01"}, "upper-1-0": {"deck": "UPPER", "type": "SLEEPER", "number": "UB02"}, "upper-1-1": {"deck": "UPPER", "type": "SEAT", "number": "US02"}, "upper-2-0": {"deck": "UPPER", "type": "SLEEPER", "number": "UB03"}, "upper-2-1": {"deck": "UPPER", "type": "SEAT", "number": "US03"}, "upper-3-0": {"deck": "UPPER", "type": "SLEEPER", "number": "UB04"}, "upper-3-1": {"deck": "UPPER", "type": "SEAT", "number": "US04"}}}', '2025-02-26 05:05:55.679', 'cm78y6zu00001qp7yd8i4ovsz', 't');
INSERT INTO "bus_ticket"."bus_layouts" ("id", "layout_name", "total_seats", "sleeper_seats", "seater_seats", "has_upper_deck", "upper_deck_seats", "sleeper_price", "seater_price", "row_count", "column_count", "layout_json", "created_at", "user_id", "is_active") VALUES ('cm7zvx2bz0000s04r6h3klqxf', 'new-lay', 16, 8, 8, 'f', 0, 200.00, 100.00, 4, 4, '{"rows": [["SEAT", "SEAT", "SLEEPER", "SLEEPER"], ["SEAT", "SEAT", "SLEEPER", "SLEEPER"], ["SLEEPER", "SLEEPER", "SEAT", "SEAT"], ["SLEEPER", "SLEEPER", "SEAT", "SEAT"]], "seats": {"lower-0-0": {"deck": "LOWER", "type": "SEAT", "number": "LS01"}, "lower-0-1": {"deck": "LOWER", "type": "SEAT", "number": "LS02"}, "lower-0-2": {"deck": "LOWER", "type": "SLEEPER", "number": "LB05"}, "lower-0-3": {"deck": "LOWER", "type": "SLEEPER", "number": "LB06"}, "lower-1-0": {"deck": "LOWER", "type": "SEAT", "number": "LS04"}, "lower-1-1": {"deck": "LOWER", "type": "SEAT", "number": "LS03"}, "lower-1-2": {"deck": "LOWER", "type": "SLEEPER", "number": "LB08"}, "lower-1-3": {"deck": "LOWER", "type": "SLEEPER", "number": "LB07"}, "lower-2-0": {"deck": "LOWER", "type": "SLEEPER", "number": "LB01"}, "lower-2-1": {"deck": "LOWER", "type": "SLEEPER", "number": "LB02"}, "lower-2-2": {"deck": "LOWER", "type": "SEAT", "number": "LS05"}, "lower-2-3": {"deck": "LOWER", "type": "SEAT", "number": "LS06"}, "lower-3-0": {"deck": "LOWER", "type": "SLEEPER", "number": "LB04"}, "lower-3-1": {"deck": "LOWER", "type": "SLEEPER", "number": "LB03"}, "lower-3-2": {"deck": "LOWER", "type": "SEAT", "number": "LS08"}, "lower-3-3": {"deck": "LOWER", "type": "SEAT", "number": "LS07"}}}', '2025-03-08 07:30:11.423', 'cm78y6zu00001qp7yd8i4ovsz', 't');
INSERT INTO "bus_ticket"."bus_layouts" ("id", "layout_name", "total_seats", "sleeper_seats", "seater_seats", "has_upper_deck", "upper_deck_seats", "sleeper_price", "seater_price", "row_count", "column_count", "layout_json", "created_at", "user_id", "is_active") VALUES ('cm7zzkc7v0000gz9n12syffsm', 'new-lay-12', 12, 6, 6, 't', 6, 200.00, 100.00, 3, 2, '{"rows": [["SEAT", "SLEEPER"], ["SEAT", "SLEEPER"], ["SEAT", "SLEEPER"], ["SEAT", "SLEEPER"], ["SEAT", "SLEEPER"], ["SEAT", "SLEEPER"]], "seats": {"lower-0-0": {"deck": "LOWER", "type": "SEAT", "number": "LS01"}, "lower-0-1": {"deck": "LOWER", "type": "SLEEPER", "number": "LB01"}, "lower-1-0": {"deck": "LOWER", "type": "SEAT", "number": "LS02"}, "lower-1-1": {"deck": "LOWER", "type": "SLEEPER", "number": "LB02"}, "lower-2-0": {"deck": "LOWER", "type": "SEAT", "number": "LS03"}, "lower-2-1": {"deck": "LOWER", "type": "SLEEPER", "number": "LB03"}, "upper-0-0": {"deck": "UPPER", "type": "SEAT", "number": "US01"}, "upper-0-1": {"deck": "UPPER", "type": "SLEEPER", "number": "UB01"}, "upper-1-0": {"deck": "UPPER", "type": "SEAT", "number": "US02"}, "upper-1-1": {"deck": "UPPER", "type": "SLEEPER", "number": "UB02"}, "upper-2-0": {"deck": "UPPER", "type": "SEAT", "number": "US03"}, "upper-2-1": {"deck": "UPPER", "type": "SLEEPER", "number": "UB03"}}}', '2025-03-08 09:12:18.139', 'cm78y6zu00001qp7yd8i4ovsz', 't');
INSERT INTO "bus_ticket"."bus_layouts" ("id", "layout_name", "total_seats", "sleeper_seats", "seater_seats", "has_upper_deck", "upper_deck_seats", "sleeper_price", "seater_price", "row_count", "column_count", "layout_json", "created_at", "user_id", "is_active") VALUES ('cm80075sc0001gz9n35wo4m7v', 'new2-16', 16, 8, 8, 't', 8, 147.00, 100.00, 4, 2, '{"rows": [["SEAT", "SEAT"], ["SEAT", "SEAT"], ["SLEEPER", "SLEEPER"], ["SLEEPER", "SLEEPER"], ["SLEEPER", "SLEEPER"], ["SLEEPER", "SLEEPER"], ["SEAT", "SEAT"], ["SEAT", "SEAT"]], "seats": {"lower-0-0": {"deck": "LOWER", "type": "SEAT", "number": "LS01"}, "lower-0-1": {"deck": "LOWER", "type": "SEAT", "number": "LS02"}, "lower-1-0": {"deck": "LOWER", "type": "SEAT", "number": "LS04"}, "lower-1-1": {"deck": "LOWER", "type": "SEAT", "number": "LS03"}, "lower-2-0": {"deck": "LOWER", "type": "SLEEPER", "number": "LB02"}, "lower-2-1": {"deck": "LOWER", "type": "SLEEPER", "number": "LB01"}, "lower-3-0": {"deck": "LOWER", "type": "SLEEPER", "number": "LB03"}, "lower-3-1": {"deck": "LOWER", "type": "SLEEPER", "number": "LB04"}, "upper-0-0": {"deck": "UPPER", "type": "SLEEPER", "number": "UB01"}, "upper-0-1": {"deck": "UPPER", "type": "SLEEPER", "number": "UB02"}, "upper-1-0": {"deck": "UPPER", "type": "SLEEPER", "number": "UB04"}, "upper-1-1": {"deck": "UPPER", "type": "SLEEPER", "number": "UB03"}, "upper-2-0": {"deck": "UPPER", "type": "SEAT", "number": "US03"}, "upper-2-1": {"deck": "UPPER", "type": "SEAT", "number": "US01"}, "upper-3-0": {"deck": "UPPER", "type": "SEAT", "number": "US04"}, "upper-3-1": {"deck": "UPPER", "type": "SEAT", "number": "US02"}}}', '2025-03-08 09:30:00.962', 'cm78y6zu00001qp7yd8i4ovsz', 't');
COMMIT;

-- ----------------------------
-- Table structure for bus_schedules
-- ----------------------------
DROP TABLE IF EXISTS "bus_ticket"."bus_schedules";
CREATE TABLE "bus_ticket"."bus_schedules" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "route_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "departure_time" timestamp(3) NOT NULL,
  "arrival_time" timestamp(3) NOT NULL,
  "busType" "bus_ticket"."BusType" NOT NULL,
  "departure_date" timestamp(3) NOT NULL,
  "arrival_date" timestamp(3) NOT NULL,
  "status" "bus_ticket"."ScheduleStatus" NOT NULL DEFAULT 'ACTIVE'::"ScheduleStatus",
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  "available_seats" int4 NOT NULL DEFAULT 0,
  "is_active" bool NOT NULL DEFAULT true,
  "user_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "vehicle_id" text COLLATE "pg_catalog"."default"
)
;
ALTER TABLE "bus_ticket"."bus_schedules" OWNER TO "neondb_owner";

-- ----------------------------
-- Records of bus_schedules
-- ----------------------------
BEGIN;
INSERT INTO "bus_ticket"."bus_schedules" ("id", "route_id", "departure_time", "arrival_time", "busType", "departure_date", "arrival_date", "status", "created_at", "updated_at", "available_seats", "is_active", "user_id", "vehicle_id") VALUES ('cm7in1okq0001btboqfbj4n6a', 'cm79c5uuw00009sjdos30r9w2', '2025-02-25 05:51:00', '2025-02-25 05:51:00', 'NON_AC_SLEEPER', '2025-02-25 05:51:00', '2025-02-25 05:51:00', 'ACTIVE', '2025-02-24 05:49:47.041', '2025-03-10 06:11:47.904', 20, 't', 'cm78y6zu00001qp7yd8i4ovsz', 'cm7ekmofl0001dt8h1r1lien5');
COMMIT;

-- ----------------------------
-- Table structure for categories
-- ----------------------------
DROP TABLE IF EXISTS "bus_ticket"."categories";
CREATE TABLE "bus_ticket"."categories" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "name" text COLLATE "pg_catalog"."default" NOT NULL,
  "type" "bus_ticket"."CategoryType" NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  "user_id" text COLLATE "pg_catalog"."default" NOT NULL
)
;
ALTER TABLE "bus_ticket"."categories" OWNER TO "neondb_owner";

-- ----------------------------
-- Records of categories
-- ----------------------------
BEGIN;
INSERT INTO "bus_ticket"."categories" ("id", "name", "type", "created_at", "updated_at", "user_id") VALUES ('cm7fq8z2b0000lk8jvl2f9324', 'just test', 'INCOME', '2025-02-22 04:56:07.811', '2025-02-22 04:56:07.811', 'cm7a679lf0000gbx1zxk35fxi');
INSERT INTO "bus_ticket"."categories" ("id", "name", "type", "created_at", "updated_at", "user_id") VALUES ('cm843rzub000113ja9wfeynk6', 'Salary', 'EXPENSE', '2025-03-11 06:21:18.515', '2025-03-11 06:21:18.515', 'cm78y6zu00001qp7yd8i4ovsz');
INSERT INTO "bus_ticket"."categories" ("id", "name", "type", "created_at", "updated_at", "user_id") VALUES ('cm7ftd58900005x7pc91orawv', 'Others', 'INCOME', '2025-02-22 06:23:21.273', '2025-03-29 10:51:40.374', 'cm78y6zu00001qp7yd8i4ovsz');
COMMIT;

-- ----------------------------
-- Table structure for custom_fields
-- ----------------------------
DROP TABLE IF EXISTS "bus_ticket"."custom_fields";
CREATE TABLE "bus_ticket"."custom_fields" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "name" text COLLATE "pg_catalog"."default" NOT NULL,
  "custom_fields" jsonb,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL
)
;
ALTER TABLE "bus_ticket"."custom_fields" OWNER TO "neondb_owner";

-- ----------------------------
-- Records of custom_fields
-- ----------------------------
BEGIN;
INSERT INTO "bus_ticket"."custom_fields" ("id", "name", "custom_fields", "created_at", "updated_at") VALUES ('cm8o7j8b20000lz2yfnmui1li', 'hero_section', '[{"key": "title", "type": "content", "value": "Begin Your Journey with Comfort & Style"}, {"key": "sub_title", "type": "content", "value": "Experience hassle-free bus travel with our premium service. Book tickets instantly, travel comfortably, and reach your destination safely."}, {"key": "247_support", "type": "content", "value": "24/7 Support"}, {"key": "247_support_sub", "type": "content", "value": "Round-the-clock customer assistance"}, {"key": "premium_service", "type": "content", "value": "Premium Service"}, {"key": "premium_service_sub", "type": "content", "value": "Luxury buses with amenities"}, {"key": "secure_booking", "type": "content", "value": "Secure Booking"}, {"key": "secure_booking_sub", "type": "content", "value": "Safe & easy payment options"}, {"key": "wide_network", "type": "content", "value": "Wide Network"}, {"key": "wide_network_sub", "type": "content", "value": "Multiple routes & destinations"}, {"key": "hero_bg", "type": "image", "imagePath": "custom/customFields[10][image]-1742889708466-194548457.avif"}]', '2025-03-25 08:01:48.481', '2025-03-25 08:01:48.481');
INSERT INTO "bus_ticket"."custom_fields" ("id", "name", "custom_fields", "created_at", "updated_at") VALUES ('cm8pi42ea00002fu47bvpsgw9', 'follow_3_steps', '[{"key": "title", "type": "content", "value": "Follow 3 Steps To Get Your Online Ticket"}, {"key": "sub_title", "type": "content", "value": "Book your bus tickets in just a few simple steps. Our easy-to-follow process ensures a smooth booking experience.\n"}, {"key": "find_your_destination", "type": "content", "value": "Find Your Destination"}, {"key": "find_your_destination_title", "type": "content", "value": "Search and find the perfect bus route for your journey with our easy-to-use platform."}, {"key": "book_your_ticket", "type": "content", "value": "Book Your Ticket"}, {"key": "book_your_ticket_title", "type": "content", "value": "Secure your seat with our simple and safe online booking system."}, {"key": "start_your_journey", "type": "content", "value": "Start Your Journey"}, {"key": "start_your_journey_title", "type": "content", "value": "Enjoy a comfortable and safe journey to your destination."}]', '2025-03-26 05:45:45.756', '2025-03-26 05:45:45.756');
INSERT INTO "bus_ticket"."custom_fields" ("id", "name", "custom_fields", "created_at", "updated_at") VALUES ('cm8pj23cc000029zstqzsp3pq', 'ticket_in_3_easy_steps', '[{"key": "title", "type": "content", "value": "Book Your Ticket in 3 Easy Steps"}, {"key": "sub_title", "type": "content", "value": "Follow these simple steps to book your bus ticket and start your journey."}, {"key": " choose_destination", "type": "content", "value": "Choose Destination"}, {"key": "choose_destination_title", "type": "content", "value": "Select your departure and arrival locations from our wide network of routes."}, {"key": "pick_your_time", "type": "content", "value": "Pick Your Time"}, {"key": "pick_your_time_title", "type": "content", "value": "Choose from multiple departure times that best suit your schedule."}, {"key": "make_payment", "type": "content", "value": "Make Payment"}, {"key": "make_payment_title", "type": "content", "value": "Secure your booking with our safe and easy payment options."}]', '2025-03-26 06:12:11.491', '2025-03-26 06:12:11.491');
INSERT INTO "bus_ticket"."custom_fields" ("id", "name", "custom_fields", "created_at", "updated_at") VALUES ('cm8y0jsu10000trsjj23du9uo', 'about', '[{"key": "title", "type": "content", "value": "About Bus Broker"}, {"key": "subtitle", "type": "content", "value": "Your Trusted Travel Partner"}, {"key": "description", "type": "content", "value": "We''re dedicated to revolutionizing bus travel by providing seamless booking experiences and connecting travelers with quality bus services across the nation."}, {"key": "est2024", "type": "content", "value": "Est. 2025"}, {"key": "hero_img", "type": "image", "imagePath": "custom/customFields[4][image]-1743482640476-925628040.avif"}]', '2025-04-01 04:44:00.487', '2025-04-01 04:44:00.487');
INSERT INTO "bus_ticket"."custom_fields" ("id", "name", "custom_fields", "created_at", "updated_at") VALUES ('cm8y11g1k0001trsj5684pu12', 'contact_hero', '[{"key": "title", "type": "content", "value": "Contact Us"}, {"key": "subtitle", "type": "content", "value": "Get in Touch"}, {"key": "description", "type": "content", "value": "Have questions or need assistance? We''re here to help. Reach out to our team for prompt and friendly support."}, {"key": "est2024", "type": "content", "value": "24/7 Support"}, {"key": "hero_img", "type": "image", "imagePath": "custom/customFields[4][image]-1743484373023-969323452.avif"}]', '2025-04-01 04:57:45.848', '2025-04-01 05:12:55.717');
COMMIT;

-- ----------------------------
-- Table structure for driver_vehicle_assigned
-- ----------------------------
DROP TABLE IF EXISTS "bus_ticket"."driver_vehicle_assigned";
CREATE TABLE "bus_ticket"."driver_vehicle_assigned" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "vendor_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "driver_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "vehicle_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "assigned_from" timestamp(3) NOT NULL,
  "assigned_to" timestamp(3),
  "status" "bus_ticket"."DriverVehicleAssignedStatus" NOT NULL DEFAULT 'ACTIVE'::"DriverVehicleAssignedStatus",
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL
)
;
ALTER TABLE "bus_ticket"."driver_vehicle_assigned" OWNER TO "neondb_owner";

-- ----------------------------
-- Records of driver_vehicle_assigned
-- ----------------------------
BEGIN;
INSERT INTO "bus_ticket"."driver_vehicle_assigned" ("id", "vendor_id", "driver_id", "vehicle_id", "assigned_from", "assigned_to", "status", "created_at", "updated_at") VALUES ('cm7hibq640001j4hk24qw8bpv', 'cm78y6zu00001qp7yd8i4ovsz', 'cm7hfki6300017chwnv8g5s7t', 'cm7inthtb0003btbovkf6akm1', '2025-02-23 00:00:00', '2025-02-24 00:00:00', 'ACTIVE', '2025-02-23 10:49:51.675', '2025-03-11 07:12:40.13');
COMMIT;

-- ----------------------------
-- Table structure for drivers
-- ----------------------------
DROP TABLE IF EXISTS "bus_ticket"."drivers";
CREATE TABLE "bus_ticket"."drivers" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "vendorId" text COLLATE "pg_catalog"."default" NOT NULL,
  "name" text COLLATE "pg_catalog"."default" NOT NULL,
  "email" text COLLATE "pg_catalog"."default",
  "phone" text COLLATE "pg_catalog"."default" NOT NULL,
  "licenseNumber" text COLLATE "pg_catalog"."default" NOT NULL,
  "licenseExpiryDate" timestamp(3) NOT NULL,
  "address" text COLLATE "pg_catalog"."default",
  "status" "bus_ticket"."VendorStatus" NOT NULL DEFAULT 'ACTIVE'::"VendorStatus",
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  "driver_license_back" text COLLATE "pg_catalog"."default",
  "driver_license_front" text COLLATE "pg_catalog"."default",
  "driver_photo" text COLLATE "pg_catalog"."default",
  "password" text COLLATE "pg_catalog"."default" NOT NULL,
  "total_travel" int4 NOT NULL DEFAULT 0,
  "drivingStatus" "bus_ticket"."DrivingStatus" NOT NULL DEFAULT 'AVAILABLE'::"DrivingStatus"
)
;
ALTER TABLE "bus_ticket"."drivers" OWNER TO "neondb_owner";

-- ----------------------------
-- Records of drivers
-- ----------------------------
BEGIN;
INSERT INTO "bus_ticket"."drivers" ("id", "vendorId", "name", "email", "phone", "licenseNumber", "licenseExpiryDate", "address", "status", "created_at", "updated_at", "driver_license_back", "driver_license_front", "driver_photo", "password", "total_travel", "drivingStatus") VALUES ('cm7hfki6300017chwnv8g5s7t', 'cm78y6zu00001qp7yd8i4ovsz', 'test', 'user@gmail.com', '01723386083', 'rtyrety', '2025-03-07 00:00:00', 'Address: Bennelong Point, Sydney NSW 2000, Australia', 'ACTIVE', '2025-02-23 09:32:42.097', '2025-02-23 09:32:42.097', '/uploads/driverLicenseBack-1740303162089-968439096.png', '/uploads/driverLicenseFront-1740303162090-299796892.png', '/uploads/driverPhoto-1740303162084-132566070.png', '12345678', 0, 'AVAILABLE');
INSERT INTO "bus_ticket"."drivers" ("id", "vendorId", "name", "email", "phone", "licenseNumber", "licenseExpiryDate", "address", "status", "created_at", "updated_at", "driver_license_back", "driver_license_front", "driver_photo", "password", "total_travel", "drivingStatus") VALUES ('cm84537t90001100js1d872it', 'cm78y6zu00001qp7yd8i4ovsz', 'Mos', 'user1@gmail.com', '01723386085', '46546541321321', '2025-03-30 00:00:00', 'Address: Bennelong Point, Sydney NSW 2000, Australia', 'ACTIVE', '2025-03-11 06:58:01.676', '2025-03-11 06:58:01.676', '/uploads/driverLicenseBack-1741676269104-145452794.png', '/uploads/driverLicenseFront-1741676270218-40063870.png', '/uploads/driverPhoto-1741676269103-209968605.jpg', '12345678', 0, 'AVAILABLE');
COMMIT;

-- ----------------------------
-- Table structure for dropping_points
-- ----------------------------
DROP TABLE IF EXISTS "bus_ticket"."dropping_points";
CREATE TABLE "bus_ticket"."dropping_points" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "route_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "location_name" text COLLATE "pg_catalog"."default" NOT NULL,
  "arrival_time" timestamp(3),
  "sequence_number" int4,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL
)
;
ALTER TABLE "bus_ticket"."dropping_points" OWNER TO "neondb_owner";

-- ----------------------------
-- Records of dropping_points
-- ----------------------------
BEGIN;
INSERT INTO "bus_ticket"."dropping_points" ("id", "route_id", "location_name", "arrival_time", "sequence_number", "created_at", "updated_at") VALUES ('cm7lfybgy000379ypkvupj4wp', 'cm7lfybgw000079ypigypsxj3', 'Union Station Washington D.C', '2025-02-26 04:58:00', 1, '2025-02-26 04:54:29.527', '2025-02-26 04:54:29.527');
INSERT INTO "bus_ticket"."dropping_points" ("id", "route_id", "location_name", "arrival_time", "sequence_number", "created_at", "updated_at") VALUES ('cm7lg0yi5000779yp8yymvhmi', 'cm7lg0yi3000479yp1f7yos3y', 'San Francisco Transbay Terminal', '2025-02-27 04:56:00', 1, '2025-02-26 04:56:34.469', '2025-02-26 04:56:34.469');
INSERT INTO "bus_ticket"."dropping_points" ("id", "route_id", "location_name", "arrival_time", "sequence_number", "created_at", "updated_at") VALUES ('cm81h09xx000913gblidga1pg', 'cm79c5uuw00009sjdos30r9w2', 'Droping', '2025-03-09 13:08:00', 1, '2025-03-09 10:08:21.064', '2025-03-09 10:08:21.064');
INSERT INTO "bus_ticket"."dropping_points" ("id", "route_id", "location_name", "arrival_time", "sequence_number", "created_at", "updated_at") VALUES ('cm81h830j000d13gb1dbjvhdy', 'cm81gneyp000113gb89wjlxxf', 'Feni', '2025-03-09 13:49:00', 1, '2025-03-09 10:14:25.297', '2025-03-09 10:14:25.297');
INSERT INTO "bus_ticket"."dropping_points" ("id", "route_id", "location_name", "arrival_time", "sequence_number", "created_at", "updated_at") VALUES ('cm81h830j000e13gb2pqyfcv9', 'cm81gneyp000113gb89wjlxxf', 'Comilla', '2025-03-09 14:50:00', 2, '2025-03-09 10:14:25.297', '2025-03-09 10:14:25.297');
INSERT INTO "bus_ticket"."dropping_points" ("id", "route_id", "location_name", "arrival_time", "sequence_number", "created_at", "updated_at") VALUES ('cm81h830j000f13gbzylc2s7q', 'cm81gneyp000113gb89wjlxxf', 'Bahaddarhat', '2025-03-09 15:50:00', 3, '2025-03-09 10:14:25.297', '2025-03-09 10:14:25.297');
COMMIT;

-- ----------------------------
-- Table structure for income_expenses
-- ----------------------------
DROP TABLE IF EXISTS "bus_ticket"."income_expenses";
CREATE TABLE "bus_ticket"."income_expenses" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "category_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "amount" numeric(10,2) NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "transaction_date" timestamp(3) NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" text COLLATE "pg_catalog"."default" NOT NULL
)
;
ALTER TABLE "bus_ticket"."income_expenses" OWNER TO "neondb_owner";

-- ----------------------------
-- Records of income_expenses
-- ----------------------------
BEGIN;
INSERT INTO "bus_ticket"."income_expenses" ("id", "category_id", "amount", "description", "transaction_date", "created_at", "userId") VALUES ('cm7ftdnxw00025x7p9zxoek89', 'cm7ftd58900005x7pc91orawv', 200.00, 'hhhh', '2025-02-22 00:00:00', '2025-02-22 06:23:45.524', 'cm78y6zu00001qp7yd8i4ovsz');
INSERT INTO "bus_ticket"."income_expenses" ("id", "category_id", "amount", "description", "transaction_date", "created_at", "userId") VALUES ('cm7hipchx0003j4hki2wke075', 'cm7ftd58900005x7pc91orawv', 666.00, 'ddf', '2025-02-23 00:00:00', '2025-02-23 11:00:27.141', 'cm78y6zu00001qp7yd8i4ovsz');
INSERT INTO "bus_ticket"."income_expenses" ("id", "category_id", "amount", "description", "transaction_date", "created_at", "userId") VALUES ('cm7z1zdyp000284uvakc24ifv', 'cm7ftd58900005x7pc91orawv', 500.00, 'hhh', '2025-03-07 00:00:00', '2025-03-07 17:32:13.296', 'cm78y6zu00001qp7yd8i4ovsz');
COMMIT;

-- ----------------------------
-- Table structure for languages
-- ----------------------------
DROP TABLE IF EXISTS "bus_ticket"."languages";
CREATE TABLE "bus_ticket"."languages" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "language_code" text COLLATE "pg_catalog"."default" NOT NULL,
  "language_name" text COLLATE "pg_catalog"."default" NOT NULL,
  "is_active" bool NOT NULL DEFAULT true,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
)
;
ALTER TABLE "bus_ticket"."languages" OWNER TO "neondb_owner";

-- ----------------------------
-- Records of languages
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for menus
-- ----------------------------
DROP TABLE IF EXISTS "bus_ticket"."menus";
CREATE TABLE "bus_ticket"."menus" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "name" text COLLATE "pg_catalog"."default" NOT NULL,
  "display" bool NOT NULL DEFAULT true,
  "role" "bus_ticket"."UserRole" NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL
)
;
ALTER TABLE "bus_ticket"."menus" OWNER TO "neondb_owner";

-- ----------------------------
-- Records of menus
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for payment_types
-- ----------------------------
DROP TABLE IF EXISTS "bus_ticket"."payment_types";
CREATE TABLE "bus_ticket"."payment_types" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "payment_method" text COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "vendor_id" text COLLATE "pg_catalog"."default",
  "is_active" bool NOT NULL DEFAULT true,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL
)
;
ALTER TABLE "bus_ticket"."payment_types" OWNER TO "neondb_owner";

-- ----------------------------
-- Records of payment_types
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for routes
-- ----------------------------
DROP TABLE IF EXISTS "bus_ticket"."routes";
CREATE TABLE "bus_ticket"."routes" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "source_city" text COLLATE "pg_catalog"."default" NOT NULL,
  "destination_city" text COLLATE "pg_catalog"."default" NOT NULL,
  "distance" numeric(10,2),
  "user_id" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  "is_active" bool NOT NULL DEFAULT true
)
;
ALTER TABLE "bus_ticket"."routes" OWNER TO "neondb_owner";

-- ----------------------------
-- Records of routes
-- ----------------------------
BEGIN;
INSERT INTO "bus_ticket"."routes" ("id", "source_city", "destination_city", "distance", "user_id", "created_at", "updated_at", "is_active") VALUES ('cm7lfybgw000079ypigypsxj3', 'New York', 'Washington, D.C.', 225.50, NULL, '2025-02-26 04:54:29.527', '2025-02-26 04:54:29.527', 't');
INSERT INTO "bus_ticket"."routes" ("id", "source_city", "destination_city", "distance", "user_id", "created_at", "updated_at", "is_active") VALUES ('cm7lg0yi3000479yp1f7yos3y', 'Los Angeles', 'San Francisco', 380.75, NULL, '2025-02-26 04:56:34.469', '2025-02-26 04:56:34.469', 't');
INSERT INTO "bus_ticket"."routes" ("id", "source_city", "destination_city", "distance", "user_id", "created_at", "updated_at", "is_active") VALUES ('cm79c5uuw00009sjdos30r9w2', 'Test', 'Test2', 2424.00, NULL, '2025-02-17 17:35:10.713', '2025-03-09 10:08:21.064', 't');
INSERT INTO "bus_ticket"."routes" ("id", "source_city", "destination_city", "distance", "user_id", "created_at", "updated_at", "is_active") VALUES ('cm81gneyp000113gb89wjlxxf', 'Dhaka', 'Chittagong', 250.00, NULL, '2025-03-09 09:58:18.53', '2025-03-09 10:14:25.297', 't');
COMMIT;

-- ----------------------------
-- Table structure for settings
-- ----------------------------
DROP TABLE IF EXISTS "bus_ticket"."settings";
CREATE TABLE "bus_ticket"."settings" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "key_name" text COLLATE "pg_catalog"."default" NOT NULL,
  "value" text COLLATE "pg_catalog"."default" NOT NULL,
  "type" "bus_ticket"."SettingType" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL
)
;
ALTER TABLE "bus_ticket"."settings" OWNER TO "neondb_owner";

-- ----------------------------
-- Records of settings
-- ----------------------------
BEGIN;
INSERT INTO "bus_ticket"."settings" ("id", "key_name", "value", "type", "description", "created_at", "updated_at") VALUES ('cm88ml82i000a122nhhp76a4e', 'STRIPE_PUBLISHABLE_KEY', 'pk_test_REPLACE_ME', 'TEXT', NULL, '2025-03-14 10:18:59.995', '2025-03-15 09:30:18.809');
INSERT INTO "bus_ticket"."settings" ("id", "key_name", "value", "type", "description", "created_at", "updated_at") VALUES ('cm88ln63l0002r1nkpoe89akc', 'TWILIO_PHONE_NUMBER', '+14632823556', 'TEXT', NULL, '2025-03-14 09:52:29.257', '2025-03-15 09:30:20.827');
INSERT INTO "bus_ticket"."settings" ("id", "key_name", "value", "type", "description", "created_at", "updated_at") VALUES ('cm88ml8ec000b122njwo1vi1n', 'STRIPE_SECRET_KEY', 'sk_test_REPLACE_ME', 'TEXT', NULL, '2025-03-14 10:18:58.549', '2025-03-15 09:30:20.812');
INSERT INTO "bus_ticket"."settings" ("id", "key_name", "value", "type", "description", "created_at", "updated_at") VALUES ('cm88ln4nd0000r1nkno0maltp', 'TWILIO_AUTH_TOKEN', 'c685e7431c0ba101b83850f9ad25e5df', 'TEXT', NULL, '2025-03-14 09:52:29.257', '2025-03-15 09:30:20.827');
INSERT INTO "bus_ticket"."settings" ("id", "key_name", "value", "type", "description", "created_at", "updated_at") VALUES ('cm88ln63f0001r1nkm1u1gyph', 'TWILIO_ACCOUNT_SID', 'AC_REPLACE_ME', 'TEXT', NULL, '2025-03-14 09:52:29.257', '2025-03-15 09:30:20.83');
INSERT INTO "bus_ticket"."settings" ("id", "key_name", "value", "type", "description", "created_at", "updated_at") VALUES ('cm88m0qa10003gmd6zkefwg39', 'SITE_NAME', 'Bus Broker', 'TEXT', NULL, '2025-03-14 10:03:02.889', '2025-03-15 11:12:35.216');
INSERT INTO "bus_ticket"."settings" ("id", "key_name", "value", "type", "description", "created_at", "updated_at") VALUES ('cm88mgw9k0003122n4mip400q', 'SITE_LOGO', 'file-1742037155220-788153947.png', 'IMAGE', NULL, '2025-03-14 10:15:38.072', '2025-03-15 11:12:37.817');
INSERT INTO "bus_ticket"."settings" ("id", "key_name", "value", "type", "description", "created_at", "updated_at") VALUES ('cm88mgvpn0002122nra6vwj2m', 'LOGIN_BG', 'file-1742037155223-314912322.png', 'IMAGE', NULL, '2025-03-14 10:15:37.356', '2025-03-15 11:12:37.817');
INSERT INTO "bus_ticket"."settings" ("id", "key_name", "value", "type", "description", "created_at", "updated_at") VALUES ('cm88mgsge0001122nhlgi026x', 'REGISTER_BG', 'file-1742037155223-881332573.png', 'IMAGE', NULL, '2025-03-14 10:15:33.134', '2025-03-15 11:12:37.817');
COMMIT;

-- ----------------------------
-- Table structure for translations
-- ----------------------------
DROP TABLE IF EXISTS "bus_ticket"."translations";
CREATE TABLE "bus_ticket"."translations" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "entity_name" text COLLATE "pg_catalog"."default" NOT NULL,
  "entity_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "key_name" text COLLATE "pg_catalog"."default" NOT NULL,
  "language_code" text COLLATE "pg_catalog"."default" NOT NULL,
  "translated_text" text COLLATE "pg_catalog"."default" NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
)
;
ALTER TABLE "bus_ticket"."translations" OWNER TO "neondb_owner";

-- ----------------------------
-- Records of translations
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS "bus_ticket"."users";
CREATE TABLE "bus_ticket"."users" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "email" text COLLATE "pg_catalog"."default" NOT NULL,
  "password" text COLLATE "pg_catalog"."default" NOT NULL,
  "avatar" text COLLATE "pg_catalog"."default",
  "mobile" text COLLATE "pg_catalog"."default" NOT NULL,
  "first_name" text COLLATE "pg_catalog"."default" NOT NULL,
  "last_name" text COLLATE "pg_catalog"."default" NOT NULL,
  "gender" text COLLATE "pg_catalog"."default",
  "mobile_otp" text COLLATE "pg_catalog"."default",
  "role" "bus_ticket"."UserRole" NOT NULL DEFAULT 'USER'::"UserRole",
  "active" bool NOT NULL DEFAULT true,
  "login_attempts" int4 NOT NULL DEFAULT 0,
  "login_attempts_date" timestamp(3),
  "expiry" timestamp(3),
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL
)
;
ALTER TABLE "bus_ticket"."users" OWNER TO "neondb_owner";

-- ----------------------------
-- Records of users
-- ----------------------------
BEGIN;
INSERT INTO "bus_ticket"."users" ("id", "email", "password", "avatar", "mobile", "first_name", "last_name", "gender", "mobile_otp", "role", "active", "login_attempts", "login_attempts_date", "expiry", "created_at", "updated_at") VALUES ('cm7ym9lk900025esh1vgybl4t', '45@gmail.com', '$2a$10$bu6rI1/ryp6ywIH4DSo4subNqBw7WEE.MSU1kcWnIeUWwx55S0sPO', NULL, '01723386675', 'Moshiur', 'Rahman', 'FEMALE', NULL, 'USER', 't', 0, NULL, '2025-08-07 10:12:15.762', '2025-03-07 10:12:15.849', '2025-03-07 11:07:22.529');
INSERT INTO "bus_ticket"."users" ("id", "email", "password", "avatar", "mobile", "first_name", "last_name", "gender", "mobile_otp", "role", "active", "login_attempts", "login_attempts_date", "expiry", "created_at", "updated_at") VALUES ('cm82o7pae0000y4paw1cukupz', 'myvendor@gmail.com', '$2a$10$LvUnq3Bd3dp7fv8pT3Fex.yRnbvcMJPwgCWHOUpBgmvVanEzxWrFq', NULL, '017233845632', 'my', 'vendor', 'MALE', NULL, 'VENDOR', 't', 0, NULL, '2025-08-10 06:17:51.214', '2025-03-10 06:17:51.302', '2025-03-10 06:17:51.302');
INSERT INTO "bus_ticket"."users" ("id", "email", "password", "avatar", "mobile", "first_name", "last_name", "gender", "mobile_otp", "role", "active", "login_attempts", "login_attempts_date", "expiry", "created_at", "updated_at") VALUES ('cm7lgi3tg000b79ypp8jau6l0', 'vendor@gmail.com', '$2a$10$.c6RV1gWHUTBIaF1Jbz5yO6gm4wS/Y86jObwkdE4oUfiyqdCIG/ra', NULL, '01723386888', 'vandor', 'Demo', 'MALE', NULL, 'VENDOR', 't', 0, NULL, '2025-07-26 05:09:54.684', '2025-02-26 05:09:54.773', '2025-04-02 06:54:26.456');
INSERT INTO "bus_ticket"."users" ("id", "email", "password", "avatar", "mobile", "first_name", "last_name", "gender", "mobile_otp", "role", "active", "login_attempts", "login_attempts_date", "expiry", "created_at", "updated_at") VALUES ('cm78xeqfh0000qp7yvrqc1521', 'user@gmail.com', '$2a$10$jcIdEkpqvWIUQX70WealRumd4HGznExM6.XM2hDWHd5HmzOhot5H6', '/uploads/avatar-1742367624378-36338781.png', '01723386000', 'Moshiur', 'Rahman', 'MALE', NULL, 'USER', 't', 0, NULL, '2025-07-17 10:42:10.636', '2025-02-17 10:42:10.638', '2025-04-02 06:56:03.742');
INSERT INTO "bus_ticket"."users" ("id", "email", "password", "avatar", "mobile", "first_name", "last_name", "gender", "mobile_otp", "role", "active", "login_attempts", "login_attempts_date", "expiry", "created_at", "updated_at") VALUES ('cm8zkgrhy0000maxjqb28bix3', 'admin@example.com', '$2a$10$EWPEt/KYWE7917ZEO11e1.HB1QMmPCTaKJIbhnbszyjyq0g6C.CaW', NULL, '+8801369254756', 'Admin', 'Test', 'MALE', NULL, 'ADMIN', 't', 0, NULL, '2025-09-02 06:49:19.298', '2025-04-02 06:49:19.414', '2025-04-04 04:43:43.441');
INSERT INTO "bus_ticket"."users" ("id", "email", "password", "avatar", "mobile", "first_name", "last_name", "gender", "mobile_otp", "role", "active", "login_attempts", "login_attempts_date", "expiry", "created_at", "updated_at") VALUES ('cm7a679lf0000gbx1zxk35fxi', 'f@gmail.com', '$2a$10$qSuu9pM/3wfxhRbtjttNPuLvl/cybAiZ3HJlAHXuE2Fx3YWMZoiiK', NULL, '01723386088', 'Faraz', 'Rahman', 'MALE', NULL, 'VENDOR', 't', 0, NULL, '2025-07-18 07:36:04.838', '2025-02-18 07:36:04.947', '2025-03-30 07:57:02.94');
INSERT INTO "bus_ticket"."users" ("id", "email", "password", "avatar", "mobile", "first_name", "last_name", "gender", "mobile_otp", "role", "active", "login_attempts", "login_attempts_date", "expiry", "created_at", "updated_at") VALUES ('cm7lgjeye000c79ypy9rbvg09', 'vendor2@gmail.com', '$2a$10$EX/14AHrYXd/QXuZjWjnjOKZ7K2N4kojn9BLsVcVNzcAMDDZp4v82', NULL, '01723386055', 'vendor2', 'Demo', 'MALE', NULL, 'VENDOR', 't', 0, NULL, '2025-07-26 05:10:55.785', '2025-02-26 05:10:55.863', '2025-03-30 08:34:29.309');
INSERT INTO "bus_ticket"."users" ("id", "email", "password", "avatar", "mobile", "first_name", "last_name", "gender", "mobile_otp", "role", "active", "login_attempts", "login_attempts_date", "expiry", "created_at", "updated_at") VALUES ('cm78y6zu00001qp7yd8i4ovsz', 'mos@gmail.com', '$2a$10$2aPAiNpWEOLkBLul3LiWHeNuEti8C8AQVUQ2DkeN6bzg1ftXKdUum', '/uploads/avatar-1742367291436-59646117.png', '+8801723386083', 'Moshiur', 'Rahman', 'MALE', NULL, 'ADMIN', 't', 0, NULL, '2025-07-17 11:04:09.191', '2025-02-17 11:04:09.193', '2025-04-02 06:49:51.612');
COMMIT;

-- ----------------------------
-- Table structure for vehicles
-- ----------------------------
DROP TABLE IF EXISTS "bus_ticket"."vehicles";
CREATE TABLE "bus_ticket"."vehicles" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "vehicle_name" text COLLATE "pg_catalog"."default" NOT NULL,
  "vehicle_number" text COLLATE "pg_catalog"."default" NOT NULL,
  "vehicle_image" text COLLATE "pg_catalog"."default",
  "vehicle_status" "bus_ticket"."VehicleStatus" NOT NULL DEFAULT 'AVAILABLE'::"VehicleStatus",
  "vehicle_rating" numeric(2,1),
  "total_seats" int4 NOT NULL,
  "start_date" timestamp(3),
  "has_ac" bool NOT NULL DEFAULT false,
  "driver_name" text COLLATE "pg_catalog"."default",
  "driver_mobile" text COLLATE "pg_catalog"."default",
  "gearSystem" "bus_ticket"."GearSystem",
  "amenities" jsonb,
  "vehicle_type" text COLLATE "pg_catalog"."default" NOT NULL,
  "vehicle_brand" text COLLATE "pg_catalog"."default",
  "available_city" text COLLATE "pg_catalog"."default",
  "fuel_type" "bus_ticket"."FuelType",
  "user_id" text COLLATE "pg_catalog"."default",
  "route_id" text COLLATE "pg_catalog"."default",
  "layout_id" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL
)
;
ALTER TABLE "bus_ticket"."vehicles" OWNER TO "neondb_owner";

-- ----------------------------
-- Records of vehicles
-- ----------------------------
BEGIN;
INSERT INTO "bus_ticket"."vehicles" ("id", "vehicle_name", "vehicle_number", "vehicle_image", "vehicle_status", "vehicle_rating", "total_seats", "start_date", "has_ac", "driver_name", "driver_mobile", "gearSystem", "amenities", "vehicle_type", "vehicle_brand", "available_city", "fuel_type", "user_id", "route_id", "layout_id", "created_at", "updated_at") VALUES ('cm7inthtb0003btbovkf6akm1', 'Create new', '321654', 'vehicleImage-1740377484595-122259756.jpg', 'AVAILABLE', NULL, 18, '2025-02-25 00:00:00', 'f', 'ttt', '4564564785', 'MANUAL', '{"ids": ["[{\"id\":\"cm7ecthof000011tcme6qq6aw\",\"icon\":\"/uploads/icon-1740117141662-997552270.png\",\"name\":\"AC\"},{\"id\":\"cm7ec92q50000caboh1vuo39d\",\"icon\":\"/uploads/icon-1740116189879-212774413.png\",\"name\":\"WiFi\"},{\"id\":\"cm7hk0x780004j4hk5rlb244s\",\"icon\":\"/uploads/icon-1740310644222-48713645.png\",\"name\":\"last\"}]"]}', 'AC', NULL, 'ds', 'DIESEL', 'cm78y6zu00001qp7yd8i4ovsz', 'cm79c5uuw00009sjdos30r9w2', 'cm7bgjwv50000bgurns6jxzn8', '2025-02-24 06:11:24.604', '2025-02-24 06:11:24.604');
INSERT INTO "bus_ticket"."vehicles" ("id", "vehicle_name", "vehicle_number", "vehicle_image", "vehicle_status", "vehicle_rating", "total_seats", "start_date", "has_ac", "driver_name", "driver_mobile", "gearSystem", "amenities", "vehicle_type", "vehicle_brand", "available_city", "fuel_type", "user_id", "route_id", "layout_id", "created_at", "updated_at") VALUES ('cm7ekmofl0001dt8h1r1lien5', 'mytest', '3243424', 'vehicleImage-1740130258441-780047332.png', 'AVAILABLE', NULL, 18, '2025-02-21 00:00:00', 'f', 'ttt', '45645645653', 'MANUAL', '{"ids": ["[{\"id\":\"cm7ecthof000011tcme6qq6aw\",\"icon\":\"/uploads/icon-1740117141662-997552270.png\",\"name\":\"AC\"},{\"id\":\"cm7ec92q50000caboh1vuo39d\",\"icon\":\"/uploads/icon-1740116189879-212774413.png\",\"name\":\"WiFi\"}]"]}', 'AC', NULL, 'fdgdfg', 'DIESEL', 'cm7lgi3tg000b79ypp8jau6l0', 'cm79c5uuw00009sjdos30r9w2', 'cm7bgjwv50000bgurns6jxzn8', '2025-02-21 09:31:03.344', '2025-02-21 09:31:03.344');
INSERT INTO "bus_ticket"."vehicles" ("id", "vehicle_name", "vehicle_number", "vehicle_image", "vehicle_status", "vehicle_rating", "total_seats", "start_date", "has_ac", "driver_name", "driver_mobile", "gearSystem", "amenities", "vehicle_type", "vehicle_brand", "available_city", "fuel_type", "user_id", "route_id", "layout_id", "created_at", "updated_at") VALUES ('cm7em5r920003dt8hhvguw7dp', 'vador v', '98765434', 'vehicleImage-1740132832797-498534105.jpg', 'AVAILABLE', NULL, 18, '2025-02-22 00:00:00', 'f', 'ttt', '4564564565', 'MANUAL', '{"ids": ["[{\"id\":\"cm7ecthof000011tcme6qq6aw\",\"icon\":\"/uploads/icon-1740117141662-997552270.png\",\"name\":\"AC\"},{\"id\":\"cm7ec92q50000caboh1vuo39d\",\"icon\":\"/uploads/icon-1740116189879-212774413.png\",\"name\":\"WiFi\"}]"]}', 'AC', NULL, '', 'DIESEL', 'cm7lgi3tg000b79ypp8jau6l0', 'cm79c5uuw00009sjdos30r9w2', 'cm7bgjwv50000bgurns6jxzn8', '2025-02-21 10:13:52.811', '2025-02-21 10:13:52.811');
INSERT INTO "bus_ticket"."vehicles" ("id", "vehicle_name", "vehicle_number", "vehicle_image", "vehicle_status", "vehicle_rating", "total_seats", "start_date", "has_ac", "driver_name", "driver_mobile", "gearSystem", "amenities", "vehicle_type", "vehicle_brand", "available_city", "fuel_type", "user_id", "route_id", "layout_id", "created_at", "updated_at") VALUES ('cm7iojzt20005btbo539ndc0z', 'mytest2', '3432674', 'vehicleImage-1740378716725-587184446.png', 'AVAILABLE', NULL, 18, '2025-02-19 00:00:00', 'f', 'ttt', '66458324346', 'MANUAL', '{"ids": ["[{\"id\":\"cm7ecthof000011tcme6qq6aw\",\"icon\":\"/uploads/icon-1740117141662-997552270.png\",\"name\":\"AC\"},{\"id\":\"cm7ec92q50000caboh1vuo39d\",\"icon\":\"/uploads/icon-1740116189879-212774413.png\",\"name\":\"WiFi\"},{\"id\":\"cm7hk0x780004j4hk5rlb244s\",\"icon\":\"/uploads/icon-1740310644222-48713645.png\",\"name\":\"last\"}]"]}', 'AC', NULL, 'fdgdfg', 'DIESEL', 'cm7lgi3tg000b79ypp8jau6l0', 'cm79c5uuw00009sjdos30r9w2', 'cm7bgjwv50000bgurns6jxzn8', '2025-02-24 06:32:01.02', '2025-02-24 06:32:01.02');
INSERT INTO "bus_ticket"."vehicles" ("id", "vehicle_name", "vehicle_number", "vehicle_image", "vehicle_status", "vehicle_rating", "total_seats", "start_date", "has_ac", "driver_name", "driver_mobile", "gearSystem", "amenities", "vehicle_type", "vehicle_brand", "available_city", "fuel_type", "user_id", "route_id", "layout_id", "created_at", "updated_at") VALUES ('cm7lijrwb00059bpgq11946co', 'Orlando', 'MIA-402', 'vehicleImage-1740550029866-841196665.jpg', 'AVAILABLE', NULL, 16, '2025-02-27 00:00:00', 'f', '', '45645645653', 'MANUAL', '{"ids": ["[{\"id\":\"cm7hk0x780004j4hk5rlb244s\",\"icon\":\"/uploads/icon-1740310644222-48713645.png\",\"name\":\"last\"},{\"id\":\"cm7ec92q50000caboh1vuo39d\",\"icon\":\"/uploads/icon-1740116189879-212774413.png\",\"name\":\"WiFi\"}]"]}', 'AC', NULL, 'Detroit Bus Station', 'DIESEL', 'cm7a679lf0000gbx1zxk35fxi', 'cm7lg0yi3000479yp1f7yos3y', 'cm7lgczjd000a79ypojsiqjuj', '2025-02-26 06:07:09.875', '2025-02-26 06:07:09.875');
INSERT INTO "bus_ticket"."vehicles" ("id", "vehicle_name", "vehicle_number", "vehicle_image", "vehicle_status", "vehicle_rating", "total_seats", "start_date", "has_ac", "driver_name", "driver_mobile", "gearSystem", "amenities", "vehicle_type", "vehicle_brand", "available_city", "fuel_type", "user_id", "route_id", "layout_id", "created_at", "updated_at") VALUES ('cm7lgzsm3000k79yph37sxxz2', 'BoltBus', 'HOU-302', 'vehicleImage-1740547419785-773344166.png', 'AVAILABLE', NULL, 20, '2025-02-27 00:00:00', 'f', 'ttt', '4564564565', 'AUTOMATIC', '{"ids": ["[{\"id\":\"cm7ecthof000011tcme6qq6aw\",\"icon\":\"/uploads/icon-1740117141662-997552270.png\",\"name\":\"AC\"},{\"id\":\"cm7ec92q50000caboh1vuo39d\",\"icon\":\"/uploads/icon-1740116189879-212774413.png\",\"name\":\"WiFi\"},{\"id\":\"cm7hk0x780004j4hk5rlb244s\",\"icon\":\"/uploads/icon-1740310644222-48713645.png\",\"name\":\"last\"}]"]}', 'AC', NULL, 'Detroit Bus Station', 'DIESEL', 'cm7lgjeye000c79ypy9rbvg09', 'cm7lg0yi3000479yp1f7yos3y', 'cm7lgai8h000979yp1xrev62a', '2025-02-26 05:23:39.791', '2025-02-26 05:23:39.791');
INSERT INTO "bus_ticket"."vehicles" ("id", "vehicle_name", "vehicle_number", "vehicle_image", "vehicle_status", "vehicle_rating", "total_seats", "start_date", "has_ac", "driver_name", "driver_mobile", "gearSystem", "amenities", "vehicle_type", "vehicle_brand", "available_city", "fuel_type", "user_id", "route_id", "layout_id", "created_at", "updated_at") VALUES ('cm7ef6er00001141eja8stgzk', 'rrer', '456745675', 'vehicleImage-1740121103114-647623976.png', 'AVAILABLE', NULL, 18, '2025-02-21 00:00:00', 'f', 'ttt', '4564564565', 'AUTOMATIC', '{"ids": ["cm7ecthof000011tcme6qq6aw", "cm7ec92q50000caboh1vuo39d"]}', 'AC', NULL, 'fdg', 'PETROL', 'cm7lgi3tg000b79ypp8jau6l0', 'cm79c5uuw00009sjdos30r9w2', 'cm7bgjwv50000bgurns6jxzn8', '2025-02-21 06:58:26.216', '2025-02-21 06:58:26.216');
INSERT INTO "bus_ticket"."vehicles" ("id", "vehicle_name", "vehicle_number", "vehicle_image", "vehicle_status", "vehicle_rating", "total_seats", "start_date", "has_ac", "driver_name", "driver_mobile", "gearSystem", "amenities", "vehicle_type", "vehicle_brand", "available_city", "fuel_type", "user_id", "route_id", "layout_id", "created_at", "updated_at") VALUES ('cm7lgwv3i000i79yprjstb213', 'Megabus', 'LA-101', 'vehicleImage-1740547281344-574387306.png', 'AVAILABLE', NULL, 16, '2025-02-27 00:00:00', 'f', 'ttt', '4564564565', 'MANUAL', '{"ids": ["[{\"id\":\"cm7ec92q50000caboh1vuo39d\",\"icon\":\"/uploads/icon-1740116189879-212774413.png\",\"name\":\"WiFi\"},{\"id\":\"cm7hk0x780004j4hk5rlb244s\",\"icon\":\"/uploads/icon-1740310644222-48713645.png\",\"name\":\"last\"},{\"id\":\"cm7ecthof000011tcme6qq6aw\",\"icon\":\"/uploads/icon-1740117141662-997552270.png\",\"name\":\"AC\"}]"]}', 'AC', NULL, 'Detroit Bus Station', 'DIESEL', 'cm7lgjeye000c79ypy9rbvg09', 'cm7lfybgw000079ypigypsxj3', 'cm7lgczjd000a79ypojsiqjuj', '2025-02-26 05:21:21.349', '2025-02-26 05:21:21.349');
INSERT INTO "bus_ticket"."vehicles" ("id", "vehicle_name", "vehicle_number", "vehicle_image", "vehicle_status", "vehicle_rating", "total_seats", "start_date", "has_ac", "driver_name", "driver_mobile", "gearSystem", "amenities", "vehicle_type", "vehicle_brand", "available_city", "fuel_type", "user_id", "route_id", "layout_id", "created_at", "updated_at") VALUES ('cm7lguj6x000g79ypxurxt7ml', 'Greyhound', 'NYC-001', 'vehicleImage-1740547174256-348431879.png', 'AVAILABLE', NULL, 12, '2025-02-27 00:00:00', 'f', 'ttt', '4564564565', 'AUTOMATIC', '{"ids": ["[{\"id\":\"cm7ec92q50000caboh1vuo39d\",\"icon\":\"/uploads/icon-1740116189879-212774413.png\",\"name\":\"WiFi\"},{\"id\":\"cm7hk0x780004j4hk5rlb244s\",\"icon\":\"/uploads/icon-1740310644222-48713645.png\",\"name\":\"last\"},{\"id\":\"cm7ecthof000011tcme6qq6aw\",\"icon\":\"/uploads/icon-1740117141662-997552270.png\",\"name\":\"AC\"}]"]}', 'AC', NULL, 'Detroit Bus Station', 'DIESEL', 'cm7lgjeye000c79ypy9rbvg09', 'cm7lg0yi3000479yp1f7yos3y', 'cm7lg7yqo000879yp3ltnvb20', '2025-02-26 05:19:34.269', '2025-02-26 05:19:34.269');
INSERT INTO "bus_ticket"."vehicles" ("id", "vehicle_name", "vehicle_number", "vehicle_image", "vehicle_status", "vehicle_rating", "total_seats", "start_date", "has_ac", "driver_name", "driver_mobile", "gearSystem", "amenities", "vehicle_type", "vehicle_brand", "available_city", "fuel_type", "user_id", "route_id", "layout_id", "created_at", "updated_at") VALUES ('cm89vkh62000514gi3ut989kb', 'Volbo-2', 'Volbo-2-num', 'vehicleImage-1742023087519-116498957.jpg', 'AVAILABLE', NULL, 12, '2025-03-16 00:00:00', 'f', '', '', 'AUTOMATIC', '{"ids": ["[{\"id\":\"cm843gwv3000013jab14yr5sd\",\"icon\":\"/uploads/icon-1741673561165-378141118.png\",\"name\":\"TV\"},{\"id\":\"cm7ec92q50000caboh1vuo39d\",\"icon\":\"/uploads/icon-1740116189879-212774413.png\",\"name\":\"WiFi\"},{\"id\":\"cm7hk0x780004j4hk5rlb244s\",\"icon\":\"/uploads/icon-1741673629101-549824274.png\",\"name\":\"Just\"}]"]}', 'AC', NULL, 'Detroit Bus Station', 'DIESEL', 'cm7a679lf0000gbx1zxk35fxi', 'cm7lg0yi3000479yp1f7yos3y', 'cm7lg7yqo000879yp3ltnvb20', '2025-03-15 07:18:07.536', '2025-03-15 07:18:07.536');
COMMIT;

-- ----------------------------
-- Table structure for vendors
-- ----------------------------
DROP TABLE IF EXISTS "bus_ticket"."vendors";
CREATE TABLE "bus_ticket"."vendors" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "status" "bus_ticket"."VendorStatus" NOT NULL DEFAULT 'ACTIVE'::"VendorStatus",
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  "business_address" text COLLATE "pg_catalog"."default",
  "business_email" text COLLATE "pg_catalog"."default",
  "business_logo" text COLLATE "pg_catalog"."default",
  "business_mobile" text COLLATE "pg_catalog"."default",
  "business_name" text COLLATE "pg_catalog"."default" NOT NULL,
  "user_id" text COLLATE "pg_catalog"."default" NOT NULL
)
;
ALTER TABLE "bus_ticket"."vendors" OWNER TO "neondb_owner";

-- ----------------------------
-- Records of vendors
-- ----------------------------
BEGIN;
INSERT INTO "bus_ticket"."vendors" ("id", "status", "created_at", "updated_at", "business_address", "business_email", "business_logo", "business_mobile", "business_name", "user_id") VALUES ('cm7afurep0000gxrkpv1rmu50', 'ACTIVE', '2025-02-18 12:06:17.666', '2025-02-18 12:06:17.666', 'sdfsdf', 'g@g.com', '/uploads/businessLogo-1739880375798-673193518.jpeg', '12132146464', 'test', 'cm7a679lf0000gbx1zxk35fxi');
INSERT INTO "bus_ticket"."vendors" ("id", "status", "created_at", "updated_at", "business_address", "business_email", "business_logo", "business_mobile", "business_name", "user_id") VALUES ('cm7lgneps000d79yp9zkjq2km', 'ACTIVE', '2025-02-26 05:14:02.177', '2025-02-26 05:14:02.177', 'Covers major city-to-city bus routes in the USA.', 'vendor@gmail.com', '/uploads/businessLogo-1740546841229-79187020.jpeg', '1213214646', 'Vendor Business', 'cm7lgi3tg000b79ypp8jau6l0');
INSERT INTO "bus_ticket"."vendors" ("id", "status", "created_at", "updated_at", "business_address", "business_email", "business_logo", "business_mobile", "business_name", "user_id") VALUES ('cm82pbahy000095ami9a95rqg', 'ACTIVE', '2025-03-10 06:48:38.375', '2025-03-10 06:48:38.375', 'Defines destination terminals for each route.', 'vendor245@gmail.com', '/uploads/businessLogo-1741589316471-416756106.png', '121321464666', 'Vendor Business', 'cm82o7pae0000y4paw1cukupz');
INSERT INTO "bus_ticket"."vendors" ("id", "status", "created_at", "updated_at", "business_address", "business_email", "business_logo", "business_mobile", "business_name", "user_id") VALUES ('cm7lgopn5000e79yp2qsb5q7i', 'ACTIVE', '2025-02-26 05:15:02.994', '2025-03-10 07:00:31.604', 'Defines destination terminals for each route.', 'vendor2@gmail.com', '/uploads/businessLogo-1741590027538-456910504.png', '12132146464', 'Vendor2 Business', 'cm7lgjeye000c79ypy9rbvg09');
COMMIT;

-- ----------------------------
-- Indexes structure for table _ScheduleVehicles
-- ----------------------------
CREATE UNIQUE INDEX "_ScheduleVehicles_AB_unique" ON "bus_ticket"."_ScheduleVehicles" USING btree (
  "A" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST,
  "B" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE INDEX "_ScheduleVehicles_B_index" ON "bus_ticket"."_ScheduleVehicles" USING btree (
  "B" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table _prisma_migrations
-- ----------------------------
ALTER TABLE "bus_ticket"."_prisma_migrations" ADD CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table amenities
-- ----------------------------
CREATE UNIQUE INDEX "amenities_name_key" ON "bus_ticket"."amenities" USING btree (
  "name" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table amenities
-- ----------------------------
ALTER TABLE "bus_ticket"."amenities" ADD CONSTRAINT "amenities_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table boarding_points
-- ----------------------------
ALTER TABLE "bus_ticket"."boarding_points" ADD CONSTRAINT "boarding_points_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table bookings
-- ----------------------------
ALTER TABLE "bus_ticket"."bookings" ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table bus_layouts
-- ----------------------------
ALTER TABLE "bus_ticket"."bus_layouts" ADD CONSTRAINT "bus_layouts_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table bus_schedules
-- ----------------------------
ALTER TABLE "bus_ticket"."bus_schedules" ADD CONSTRAINT "bus_schedules_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table categories
-- ----------------------------
ALTER TABLE "bus_ticket"."categories" ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table custom_fields
-- ----------------------------
ALTER TABLE "bus_ticket"."custom_fields" ADD CONSTRAINT "custom_fields_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table driver_vehicle_assigned
-- ----------------------------
ALTER TABLE "bus_ticket"."driver_vehicle_assigned" ADD CONSTRAINT "driver_vehicle_assigned_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table drivers
-- ----------------------------
CREATE UNIQUE INDEX "drivers_email_key" ON "bus_ticket"."drivers" USING btree (
  "email" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "drivers_licenseNumber_key" ON "bus_ticket"."drivers" USING btree (
  "licenseNumber" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "drivers_phone_key" ON "bus_ticket"."drivers" USING btree (
  "phone" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table drivers
-- ----------------------------
ALTER TABLE "bus_ticket"."drivers" ADD CONSTRAINT "drivers_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table dropping_points
-- ----------------------------
ALTER TABLE "bus_ticket"."dropping_points" ADD CONSTRAINT "dropping_points_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table income_expenses
-- ----------------------------
ALTER TABLE "bus_ticket"."income_expenses" ADD CONSTRAINT "income_expenses_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table languages
-- ----------------------------
CREATE UNIQUE INDEX "languages_language_code_key" ON "bus_ticket"."languages" USING btree (
  "language_code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table languages
-- ----------------------------
ALTER TABLE "bus_ticket"."languages" ADD CONSTRAINT "languages_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table menus
-- ----------------------------
ALTER TABLE "bus_ticket"."menus" ADD CONSTRAINT "menus_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table payment_types
-- ----------------------------
CREATE UNIQUE INDEX "payment_types_payment_method_key" ON "bus_ticket"."payment_types" USING btree (
  "payment_method" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table payment_types
-- ----------------------------
ALTER TABLE "bus_ticket"."payment_types" ADD CONSTRAINT "payment_types_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table routes
-- ----------------------------
CREATE UNIQUE INDEX "routes_source_city_destination_city_key" ON "bus_ticket"."routes" USING btree (
  "source_city" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST,
  "destination_city" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table routes
-- ----------------------------
ALTER TABLE "bus_ticket"."routes" ADD CONSTRAINT "routes_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table settings
-- ----------------------------
CREATE UNIQUE INDEX "settings_key_name_key" ON "bus_ticket"."settings" USING btree (
  "key_name" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table settings
-- ----------------------------
ALTER TABLE "bus_ticket"."settings" ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table translations
-- ----------------------------
CREATE UNIQUE INDEX "translations_entity_name_entity_id_key_name_language_code_key" ON "bus_ticket"."translations" USING btree (
  "entity_name" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST,
  "entity_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST,
  "key_name" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST,
  "language_code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table translations
-- ----------------------------
ALTER TABLE "bus_ticket"."translations" ADD CONSTRAINT "translations_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table users
-- ----------------------------
CREATE UNIQUE INDEX "users_email_key" ON "bus_ticket"."users" USING btree (
  "email" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "users_mobile_key" ON "bus_ticket"."users" USING btree (
  "mobile" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table users
-- ----------------------------
ALTER TABLE "bus_ticket"."users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table vehicles
-- ----------------------------
CREATE UNIQUE INDEX "vehicles_vehicle_number_key" ON "bus_ticket"."vehicles" USING btree (
  "vehicle_number" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table vehicles
-- ----------------------------
ALTER TABLE "bus_ticket"."vehicles" ADD CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table vendors
-- ----------------------------
CREATE UNIQUE INDEX "vendors_business_email_key" ON "bus_ticket"."vendors" USING btree (
  "business_email" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "vendors_user_id_key" ON "bus_ticket"."vendors" USING btree (
  "user_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table vendors
-- ----------------------------
ALTER TABLE "bus_ticket"."vendors" ADD CONSTRAINT "vendors_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Foreign Keys structure for table _ScheduleVehicles
-- ----------------------------
ALTER TABLE "bus_ticket"."_ScheduleVehicles" ADD CONSTRAINT "_ScheduleVehicles_A_fkey" FOREIGN KEY ("A") REFERENCES "bus_ticket"."bus_schedules" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bus_ticket"."_ScheduleVehicles" ADD CONSTRAINT "_ScheduleVehicles_B_fkey" FOREIGN KEY ("B") REFERENCES "bus_ticket"."vehicles" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table boarding_points
-- ----------------------------
ALTER TABLE "bus_ticket"."boarding_points" ADD CONSTRAINT "boarding_points_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "bus_ticket"."routes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table bookings
-- ----------------------------
ALTER TABLE "bus_ticket"."bookings" ADD CONSTRAINT "bookings_boarding_point_id_fkey" FOREIGN KEY ("boarding_point_id") REFERENCES "bus_ticket"."boarding_points" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bus_ticket"."bookings" ADD CONSTRAINT "bookings_dropping_point_id_fkey" FOREIGN KEY ("dropping_point_id") REFERENCES "bus_ticket"."dropping_points" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bus_ticket"."bookings" ADD CONSTRAINT "bookings_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "bus_ticket"."routes" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bus_ticket"."bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "bus_ticket"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bus_ticket"."bookings" ADD CONSTRAINT "bookings_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "bus_ticket"."vehicles" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bus_ticket"."bookings" ADD CONSTRAINT "bookings_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "bus_ticket"."vendors" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table bus_schedules
-- ----------------------------
ALTER TABLE "bus_ticket"."bus_schedules" ADD CONSTRAINT "bus_schedules_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "bus_ticket"."routes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bus_ticket"."bus_schedules" ADD CONSTRAINT "bus_schedules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "bus_ticket"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table driver_vehicle_assigned
-- ----------------------------
ALTER TABLE "bus_ticket"."driver_vehicle_assigned" ADD CONSTRAINT "driver_vehicle_assigned_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "bus_ticket"."drivers" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bus_ticket"."driver_vehicle_assigned" ADD CONSTRAINT "driver_vehicle_assigned_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "bus_ticket"."vehicles" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bus_ticket"."driver_vehicle_assigned" ADD CONSTRAINT "driver_vehicle_assigned_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "bus_ticket"."users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table drivers
-- ----------------------------
ALTER TABLE "bus_ticket"."drivers" ADD CONSTRAINT "drivers_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "bus_ticket"."users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table dropping_points
-- ----------------------------
ALTER TABLE "bus_ticket"."dropping_points" ADD CONSTRAINT "dropping_points_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "bus_ticket"."routes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table income_expenses
-- ----------------------------
ALTER TABLE "bus_ticket"."income_expenses" ADD CONSTRAINT "income_expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "bus_ticket"."categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table payment_types
-- ----------------------------
ALTER TABLE "bus_ticket"."payment_types" ADD CONSTRAINT "payment_types_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "bus_ticket"."vendors" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table routes
-- ----------------------------
ALTER TABLE "bus_ticket"."routes" ADD CONSTRAINT "routes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "bus_ticket"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table translations
-- ----------------------------
ALTER TABLE "bus_ticket"."translations" ADD CONSTRAINT "translations_language_code_fkey" FOREIGN KEY ("language_code") REFERENCES "bus_ticket"."languages" ("language_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table vehicles
-- ----------------------------
ALTER TABLE "bus_ticket"."vehicles" ADD CONSTRAINT "vehicles_layout_id_fkey" FOREIGN KEY ("layout_id") REFERENCES "bus_ticket"."bus_layouts" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bus_ticket"."vehicles" ADD CONSTRAINT "vehicles_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "bus_ticket"."routes" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "bus_ticket"."vehicles" ADD CONSTRAINT "vehicles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "bus_ticket"."users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table vendors
-- ----------------------------
ALTER TABLE "bus_ticket"."vendors" ADD CONSTRAINT "vendors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "bus_ticket"."users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
