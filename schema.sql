-- PostgreSQL Database Setup for WhatsApp Hotel Booking System
-- Run these commands in your PostgreSQL database

-- Create database (run this as postgres user)
CREATE DATABASE hotel_booking;

-- Connect to the hotel_booking database before running the rest
\c hotel_booking;

-- Create hotels table
CREATE TABLE hotels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT,
    price_per_night DECIMAL(10,2) NOT NULL,
    total_rooms INTEGER NOT NULL DEFAULT 1,
    available_rooms INTEGER,
    amenities JSONB,
    images JSONB,
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    rating DECIMAL(2,1) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create bookings table
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    customer_name VARCHAR(255),
    hotel_id INTEGER NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests INTEGER NOT NULL DEFAULT 1,
    rooms INTEGER NOT NULL DEFAULT 1,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'payment_pending', 'paid', 'confirmed', 'cancelled', 'payment_failed', 'completed')),
    mpesa_checkout_id VARCHAR(100),
    mpesa_transaction_id VARCHAR(100),
    booking_reference VARCHAR(50) UNIQUE,
    special_requests TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
);

-- Create conversations table for bot state management
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    current_state VARCHAR(50) NOT NULL DEFAULT 'welcome',
    context JSONB DEFAULT '{}',
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create customers table for customer information
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255),
    email VARCHAR(100),
    preferred_location VARCHAR(100),
    total_bookings INTEGER DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0,
    last_booking_date DATE,
    is_vip BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create payment_logs table for tracking all payment attempts
CREATE TABLE payment_logs (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    mpesa_checkout_id VARCHAR(100),
    mpesa_transaction_id VARCHAR(100),
    status VARCHAR(20) NOT NULL,
    response_code VARCHAR(10),
    response_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_bookings_phone_number ON bookings(phone_number);
CREATE INDEX idx_bookings_hotel_id ON bookings(hotel_id);
CREATE INDEX idx_bookings_check_in ON bookings(check_in);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_mpesa_checkout ON bookings(mpesa_checkout_id);
CREATE INDEX idx_hotels_location ON hotels(location);
CREATE INDEX idx_hotels_is_active ON hotels(is_active);
CREATE INDEX idx_conversations_phone_number ON conversations(phone_number);
CREATE INDEX idx_customers_phone_number ON customers(phone_number);

-- Create function to generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference() RETURNS TEXT AS $$
BEGIN
    RETURN 'HB' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(NEXTVAL('booking_ref_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Create sequence for booking reference
CREATE SEQUENCE booking_ref_seq START 1;

-- Create trigger to auto-generate booking reference
CREATE OR REPLACE FUNCTION set_booking_reference() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_reference IS NULL THEN
        NEW.booking_reference := generate_booking_reference();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_reference_trigger
    BEFORE INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION set_booking_reference();

-- Create function to update available_rooms when booking is made
CREATE OR REPLACE FUNCTION update_room_availability() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
        UPDATE hotels 
        SET available_rooms = available_rooms - NEW.rooms 
        WHERE id = NEW.hotel_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
            UPDATE hotels 
            SET available_rooms = available_rooms - NEW.rooms 
            WHERE id = NEW.hotel_id;
        ELSIF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
            UPDATE hotels 
            SET available_rooms = available_rooms + OLD.rooms 
            WHERE id = NEW.hotel_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER room_availability_trigger
    AFTER INSERT OR UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_room_availability();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_hotels_updated_at BEFORE UPDATE ON hotels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample hotel data
INSERT INTO hotels (name, location, description, price_per_night, total_rooms, available_rooms, amenities, contact_phone, rating) VALUES
('Sarova Stanley Hotel', 'Nairobi CBD', 'Luxury hotel in the heart of Nairobi with excellent facilities', 15000.00, 50, 50, '["WiFi", "Restaurant", "Gym", "Pool", "Conference Rooms", "Parking"]', '+254712345678', 4.5),
('Villa Rosa Kempinski', 'Nairobi Westlands', 'Premium hotel with world-class amenities in Westlands', 25000.00, 40, 40, '["WiFi", "Spa", "Restaurant", "Bar", "Gym", "Pool", "Business Center"]', '+254712345679', 4.8),
('Tamarind Dhow', 'Mombasa', 'Unique floating restaurant and hotel experience', 12000.00, 20, 20, '["WiFi", "Restaurant", "Bar", "Sea View", "Cultural Shows"]', '+254712345680', 4.3),
('Serena Hotel Nairobi', 'Nairobi CBD', 'Elegant hotel blending modern comfort with African heritage', 18000.00, 60, 60, '["WiFi", "Restaurant", "Bar", "Gym", "Pool", "Spa", "Conference Rooms"]', '+254712345681', 4.6),
('Whitesands Beach Resort', 'Mombasa North Coast', 'Beachfront resort with pristine white sand beaches', 20000.00, 80, 80, '["WiFi", "Beach Access", "Pool", "Restaurant", "Bar", "Water Sports", "Spa"]', '+254712345682', 4.4),
('Imperial Hotel Kisumu', 'Kisumu', 'Historic hotel overlooking Lake Victoria', 8000.00, 30, 30, '["WiFi", "Restaurant", "Bar", "Lake View", "Conference Rooms"]', '+254712345683', 4.0),
('Merica Hotel Nakuru', 'Nakuru', 'Modern hotel in the heart of Nakuru town', 6000.00, 25, 25, '["WiFi", "Restaurant", "Bar", "Parking", "Conference Rooms"]', '+254712345684', 3.8),
('Eldoret Lodge', 'Eldoret', 'Comfortable accommodation for business and leisure travelers', 7000.00, 35, 35, '["WiFi", "Restaurant", "Bar", "Gym", "Parking"]', '+254712345685', 3.9);

-- Insert sample customer data
INSERT INTO customers (phone_number, name, preferred_location, total_bookings) VALUES
('+254712000001', 'John Kamau', 'Nairobi', 0),
('+254712000002', 'Mary Wanjiku', 'Mombasa', 0),
('+254712000003', 'Peter Otieno', 'Kisumu', 0);

-- Create views for easy querying
CREATE VIEW available_hotels AS
SELECT 
    h.*,
    CASE 
        WHEN h.available_rooms > 0 THEN 'Available'
        ELSE 'Fully Booked'
    END as availability_status
FROM hotels h
WHERE h.is_active = true;

CREATE VIEW booking_summary AS
SELECT 
    b.id,
    b.booking_reference,
    b.phone_number,
    h.name as hotel_name,
    h.location,
    b.check_in,
    b.check_out,
    b.guests,
    b.total_amount,
    b.status,
    b.mpesa_transaction_id,
    b.created_at
FROM bookings b
JOIN hotels h ON b.hotel_id = h.id
ORDER BY b.created_at DESC;

-- Create function to check room availability for date range
CREATE OR REPLACE FUNCTION check_room_availability(
    hotel_id_param INTEGER,
    check_in_param DATE,
    check_out_param DATE,
    rooms_needed INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
    booked_rooms INTEGER;
    total_rooms INTEGER;
BEGIN
    -- Get total rooms for the hotel
    SELECT total_rooms INTO total_rooms FROM hotels WHERE id = hotel_id_param;
    
    -- Count booked rooms for the date range
    SELECT COALESCE(SUM(rooms), 0) INTO booked_rooms
    FROM bookings
    WHERE hotel_id = hotel_id_param
        AND status IN ('paid', 'confirmed')
        AND (
            (check_in >= check_in_param AND check_in < check_out_param) OR
            (check_out > check_in_param AND check_out <= check_out_param) OR
            (check_in <= check_in_param AND check_out >= check_out_param)
        );
    
    RETURN (total_rooms - booked_rooms) >= rooms_needed;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions (adjust username as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- Display setup completion message
SELECT 'Database setup completed successfully!' as message;