-- ==========================================
-- DriveCare Database Mock Seed Data
-- Location: database/seed.sql
-- ==========================================

-- 1. Seed Users (Patients & Relatives)
INSERT INTO public.users (line_id, profile_img, name, first_name, last_name, phone_number, address, role)
VALUES 
('U_LINE_001', 'https://res.cloudinary.com/demo/image/upload/v1580123456/sample.jpg', 'สมชาย ใจดี', 'สมชาย', 'ใจดี', '0812345678', '123/45 ถนนรัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพฯ', 'user'),
('U_LINE_002', 'https://res.cloudinary.com/demo/image/upload/v1580123456/sample.jpg', 'สมศรี รักเรียน', 'สมศรี', 'รักเรียน', '0823456789', '99/9 หมู่ 3 ตำบลบางกรวย อำเภอบางกรวย นนทบุรี', 'user')
ON CONFLICT DO NOTHING;

-- 2. Seed Drivers (Caregivers & Transport Staff)
INSERT INTO public.drivers (line_id, first_name, last_name, phone_number, status, car_brand, car_model, car_plate, verified, city, role)
VALUES 
('D_LINE_001', 'สมศักดิ์', 'รักบริการ', '0898765432', 'active', 'Toyota', 'Commuter', 'ฮภ 9999 กรุงเทพมหานคร', 'Approved', 'กรุงเทพมหานคร', 'driver'),
('D_LINE_002', 'วิชัย', 'ว่องไว', '0887654321', 'active', 'Honda', 'Mobilio', 'กข 1234 นนทบุรี', 'Approved', 'นนทบุรี', 'driver')
ON CONFLICT DO NOTHING;

-- 3. Seed Admins
-- The password is set to a placeholder (in practice, this would be a bcrypt hash like $2b$10/...)
INSERT INTO public.admin (user_name, password, role)
VALUES 
('admin', '$2b$10$eE04J.aGqW9P7d11JswMze5pQY80D6Yh4u2d8d8Wn16zM5WbL7v8W', 'admin') -- default password placeholder
ON CONFLICT DO NOTHING;

-- 4. Seed Bookings
INSERT INTO public.bookings (user_id, driver_id, booking_date, start_time, end_time, total_hours, total_price, status, payment_status, payment_method, payment_slip, payment_at)
VALUES 
(1, 1, CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour', '1', '450.00', 'SUCCESS', 'success', 'transfer', 'https://res.cloudinary.com/demo/image/upload/v1580123456/slip.jpg', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
(2, 2, CURRENT_DATE + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day 2 hours', '2', '800.00', 'ASSIGNED', 'pending', 'transfer', NULL, NULL)
ON CONFLICT DO NOTHING;

-- 5. Seed Locations
INSERT INTO public.locations (booking_id, pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng)
VALUES 
(1, '123/45 ถนนรัชดาภิเษก เขตดินแดง', 13.7765, 100.5694, 'โรงพยาบาลพระมงกุฎเกล้า', 13.7663, 100.5358),
(2, '99/9 หมู่ 3 อำเภอบางกรวย นนทบุรี', 13.8052, 100.4735, 'โรงพยาบาลศิริราช', 13.7578, 100.4859)
ON CONFLICT DO NOTHING;

-- 6. Seed Logs
INSERT INTO public.logs (booking_id, event_type, event_action, message, actor_id, actor_type)
VALUES 
(1, 'booking', 'create', 'สร้างรายการจองรถโดยผู้ใช้งาน', '1', 'user'),
(1, 'booking', 'assign', 'แอดมินมอบหมายงานให้คนขับ สมศักดิ์ รักบริการ', 'admin', 'admin'),
(1, 'booking', 'complete', 'งานเสร็จสิ้นโดยคนขับ', '1', 'driver'),
(2, 'booking', 'create', 'สร้างรายการจองรถโดยผู้ใช้งาน', '2', 'user')
ON CONFLICT DO NOTHING;

-- 7. Seed Reports (Tickets)
INSERT INTO public.reports (booking_id, report_type, message, actor_id, actor_type, is_replied)
VALUES 
(1, 'general', 'คนขับพูดจาสุภาพเรียบร้อยดีมากครับ แนะนำเลย', 1, 'user', false)
ON CONFLICT DO NOTHING;

-- 8. Seed Health Records
INSERT INTO public.health_records (user_id, weight, height, bmi, congenital_diseases, allergies)
VALUES 
(1, 72.50, 175.00, 23.70, ARRAY['เบาหวาน', 'ความดันโลหิตสูง'], ARRAY['ยาเพนิซิลลิน']),
(2, 54.00, 160.00, 21.10, ARRAY['ภูมิแพ้อากาศ'], ARRAY['อาหารทะเล'])
ON CONFLICT DO NOTHING;

-- 9. Seed Health History (Historical data for charting weight updates)
INSERT INTO public.health_history (user_id, weight, recorded_at)
VALUES 
(1, 74.00, CURRENT_DATE - INTERVAL '1 month'),
(1, 73.20, CURRENT_DATE - INTERVAL '2 weeks'),
(1, 72.50, CURRENT_DATE),
(2, 55.20, CURRENT_DATE - INTERVAL '1 month'),
(2, 54.00, CURRENT_DATE)
ON CONFLICT DO NOTHING;
