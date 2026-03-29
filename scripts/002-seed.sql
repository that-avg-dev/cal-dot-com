-- SETTINGS
INSERT INTO settings (timezone, user_name, user_email) VALUES
('Asia/Kolkata', 'Kairvee', 'kairvee@example.com');

-- AVAILABILITY (more realistic working hours)
INSERT INTO availability (day_of_week, start_time, end_time, is_available) VALUES
(0, '10:00', '14:00', false),
(1, '09:00', '18:00', true),
(2, '09:00', '18:00', true),
(3, '09:00', '18:00', true),
(4, '09:00', '18:00', true),
(5, '10:00', '16:00', true),
(6, '10:00', '14:00', false);

-- EVENT TYPES (expanded)
INSERT INTO event_types (title, description, duration, slug, color) VALUES
('15 Min Quick Chat', 'Quick intro call', 15, 'quick-chat', '#3b82f6'),
('30 Min Meeting', 'General discussion', 30, 'meeting-30', '#10b981'),
('60 Min Deep Dive', 'Detailed session', 60, 'deep-dive', '#f59e0b'),
('Portfolio Review', 'Review projects & resume', 45, 'portfolio-review', '#8b5cf6'),
('Mock Interview', 'Practice technical interview', 60, 'mock-interview', '#ef4444'),
('Career Guidance', 'Career advice session', 30, 'career-guidance', '#14b8a6');

-- BOOKINGS (realistic spread: past + future)
INSERT INTO bookings (event_type_id, booker_name, booker_email, start_time, end_time, status, notes) VALUES
-- Past
(1, 'Aman Sharma', 'aman@gmail.com', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '15 min', 'confirmed', 'Asked about internships'),
(2, 'Riya Patel', 'riya@gmail.com', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '30 min', 'confirmed', 'Discussed project ideas'),
(4, 'Sneha Kapoor', 'sneha@gmail.com', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '45 min', 'confirmed', 'Portfolio feedback'),

-- Today
(3, 'Arjun Mehta', 'arjun@gmail.com', NOW() + INTERVAL '2 hours', NOW() + INTERVAL '3 hours', 'confirmed', 'Deep dive into DSA'),
(2, 'Neha Verma', 'neha@gmail.com', NOW() + INTERVAL '4 hours', NOW() + INTERVAL '4 hours 30 minutes', 'confirmed', 'General guidance'),

-- Future
(5, 'Rahul Singh', 'rahul@gmail.com', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 1 hour', 'confirmed', 'Mock interview'),
(6, 'Priya Nair', 'priya@gmail.com', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 30 minutes', 'confirmed', 'Career advice'),
(3, 'Dev Patel', 'dev@gmail.com', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days 1 hour', 'confirmed', 'System design'),
(1, 'Kunal Shah', 'kunal@gmail.com', NOW() + INTERVAL '4 days', NOW() + INTERVAL '4 days 15 minutes', 'confirmed', 'Quick call'),
(4, 'Simran Kaur', 'simran@gmail.com', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days 45 minutes', 'confirmed', 'Resume review');
