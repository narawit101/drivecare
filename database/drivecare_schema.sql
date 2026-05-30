-- ==========================================
-- DriveCare Consolidated Database Schema
-- Location: database/health_schema.sql
-- ==========================================

-- ------------------------------------------
-- 1. Custom Types & ENUMs
-- ------------------------------------------
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'driver_status') THEN
        CREATE TYPE driver_status AS ENUM ('active', 'inactive', 'banned');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'driverstatus') THEN
        CREATE TYPE driverstatus AS ENUM ('pending', 'approved', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'driver', 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verify_status') THEN
        CREATE TYPE verify_status AS ENUM ('Pending', 'Approved', 'Rejected');
    END IF;
END $$;

-- ------------------------------------------
-- 2. Core Tables
-- ------------------------------------------

-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
    user_id SERIAL PRIMARY KEY,
    line_id CHARACTER VARYING(50),
    profile_img TEXT,
    name CHARACTER VARYING(100),
    first_name CHARACTER VARYING(100),
    last_name CHARACTER VARYING(100),
    phone_number CHARACTER VARYING(20),
    address CHARACTER VARYING(255),
    role CHARACTER VARYING(50) DEFAULT 'user'::character varying,
    create_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Drivers Table
CREATE TABLE IF NOT EXISTS public.drivers (
    driver_id SERIAL PRIMARY KEY,
    line_id CHARACTER VARYING(50),
    first_name CHARACTER VARYING(100),
    last_name CHARACTER VARYING(100),
    phone_number CHARACTER VARYING(20),
    status CHARACTER VARYING(50),
    profile_img TEXT,
    citizen_id_img TEXT,
    driving_license_img TEXT,
    car_img TEXT,
    act_img TEXT,
    car_brand CHARACTER VARYING(100),
    car_model CHARACTER VARYING(100),
    car_plate CHARACTER VARYING(50),
    verified CHARACTER VARYING(50) DEFAULT 'pending_approval'::character varying,
    city CHARACTER VARYING(100),
    role CHARACTER VARYING(50) DEFAULT 'driver'::character varying,
    create_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admin Table
CREATE TABLE IF NOT EXISTS public.admin (
    admin_id SERIAL PRIMARY KEY,
    user_name CHARACTER VARYING(100) NOT NULL,
    password CHARACTER VARYING(255) NOT NULL,
    role CHARACTER VARYING(50) NOT NULL
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
    booking_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    driver_id INT REFERENCES public.drivers(driver_id) ON DELETE SET NULL,
    booking_date DATE,
    start_time TIMESTAMP WITHOUT TIME ZONE,
    end_time TIMESTAMP WITHOUT TIME ZONE,
    total_hours CHARACTER VARYING(50),
    total_price CHARACTER VARYING(50),
    status CHARACTER VARYING(50),
    create_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payment_status CHARACTER VARYING(20) DEFAULT 'pending'::character varying,
    payment_method CHARACTER VARYING(50) DEFAULT 'transfer'::character varying,
    payment_slip TEXT,
    payment_at TIMESTAMP WITH TIME ZONE
);

-- Locations Table
CREATE TABLE IF NOT EXISTS public.locations (
    location_id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL REFERENCES public.bookings(booking_id) ON DELETE CASCADE,
    pickup_address TEXT,
    pickup_lat DOUBLE PRECISION,
    pickup_lng DOUBLE PRECISION,
    dropoff_address TEXT,
    dropoff_lat DOUBLE PRECISION,
    dropoff_lng DOUBLE PRECISION,
    create_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Logs Table
CREATE TABLE IF NOT EXISTS public.logs (
    log_id SERIAL PRIMARY KEY,
    booking_id INT REFERENCES public.bookings(booking_id) ON DELETE CASCADE,
    event_type CHARACTER VARYING(100),
    event_action CHARACTER VARYING(100),
    message TEXT,
    actor_id CHARACTER VARYING(100),
    create_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actor_type CHARACTER VARYING(50)
);

-- Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
    report_id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL REFERENCES public.bookings(booking_id) ON DELETE CASCADE,
    report_type CHARACTER VARYING(100),
    message TEXT,
    create_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actor_id INT NOT NULL,
    actor_type CHARACTER VARYING(20) NOT NULL,
    is_replied BOOLEAN DEFAULT FALSE NOT NULL
);

-- Health Records Table (BMI and current health details)
CREATE TABLE IF NOT EXISTS public.health_records (
    health_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES public.users(user_id) ON DELETE CASCADE,
    weight NUMERIC(5, 2),
    height NUMERIC(5, 2),
    bmi NUMERIC(4, 2),
    congenital_diseases TEXT[] COLLATE pg_catalog."default",
    allergies TEXT[] COLLATE pg_catalog."default",
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Health History Table (Weight tracking over time)
CREATE TABLE IF NOT EXISTS public.health_history (
    history_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES public.users(user_id) ON DELETE CASCADE,
    weight NUMERIC(5, 2),
    recorded_at DATE DEFAULT CURRENT_DATE
);
