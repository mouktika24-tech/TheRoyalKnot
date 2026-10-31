BEGIN;

INSERT INTO clients (name, email, phone)
VALUES
    ('Aarav Sharma', 'seed.client01@royalknot.local', '9876500001'),
    ('Diya Mehta', 'seed.client02@royalknot.local', '9876500002'),
    ('Ishaan Kapoor', 'seed.client03@royalknot.local', '9876500003'),
    ('Anaya Singh', 'seed.client04@royalknot.local', '9876500004'),
    ('Rohan Malhotra', 'seed.client05@royalknot.local', '9876500005'),
    ('Saanvi Rathore', 'seed.client06@royalknot.local', '9876500006'),
    ('Kabir Choudhary', 'seed.client07@royalknot.local', '9876500007'),
    ('Myra Agarwal', 'seed.client08@royalknot.local', '9876500008'),
    ('Arjun Bansal', 'seed.client09@royalknot.local', '9876500009'),
    ('Kiara Shekhawat', 'seed.client10@royalknot.local', '9876500010'),
    ('Veer Sethi', 'seed.client11@royalknot.local', '9876500011'),
    ('Aadhya Purohit', 'seed.client12@royalknot.local', '9876500012'),
    ('Reyansh Joshi', 'seed.client13@royalknot.local', '9876500013'),
    ('Pari Desai', 'seed.client14@royalknot.local', '9876500014'),
    ('Dhruv Bhati', 'seed.client15@royalknot.local', '9876500015'),
    ('Tara Khandelwal', 'seed.client16@royalknot.local', '9876500016'),
    ('Vivaan Rathore', 'seed.client17@royalknot.local', '9876500017'),
    ('Ira Mathur', 'seed.client18@royalknot.local', '9876500018'),
    ('Advik Goyal', 'seed.client19@royalknot.local', '9876500019'),
    ('Meera Solanki', 'seed.client20@royalknot.local', '9876500020'),
    ('Krish Vyas', 'seed.client21@royalknot.local', '9876500021'),
    ('Navya Chawla', 'seed.client22@royalknot.local', '9876500022'),
    ('Shaurya Tanwar', 'seed.client23@royalknot.local', '9876500023'),
    ('Riya Parekh', 'seed.client24@royalknot.local', '9876500024'),
    ('Atharv Jain', 'seed.client25@royalknot.local', '9876500025')
ON CONFLICT (email) DO NOTHING;

WITH seed_weddings AS (
    SELECT *
    FROM (VALUES
        ('seed.client01@royalknot.local', 'Aarav Sharma & Meera Kapoor', 'Jaipur', 'Rambagh Palace', 'Full-Service', DATE '2026-01-16', DATE '2026-01-18', 520, 32500000, 'COMPLETED'),
        ('seed.client02@royalknot.local', 'Rishi Mehta & Diya Mehta', 'Udaipur', 'The Oberoi Udaivilas', 'Full-Service', DATE '2026-02-06', DATE '2026-02-08', 460, 29000000, 'COMPLETED'),
        ('seed.client03@royalknot.local', 'Ishaan Kapoor & Naina Khanna', 'Jaipur', 'Fairmont Jaipur', 'Full-Service', DATE '2026-03-13', DATE '2026-03-15', 610, 38000000, 'COMPLETED'),
        ('seed.client04@royalknot.local', 'Armaan Singh & Anaya Singh', 'Udaipur', 'Taj Lake Palace', 'Full-Service', DATE '2026-04-10', DATE '2026-04-12', 430, 27500000, 'COMPLETED'),
        ('seed.client05@royalknot.local', 'Rohan Malhotra & Kavya Sood', 'Jaipur', 'Jai Mahal Palace', 'Partial/Day-of', DATE '2026-05-08', DATE '2026-05-10', 480, 30000000, 'COMPLETED'),
        ('seed.client06@royalknot.local', 'Kunal Rathore & Saanvi Rathore', 'Udaipur', 'The Leela Palace Udaipur', 'Full-Service', DATE '2026-06-12', DATE '2026-06-14', 700, 45000000, 'COMPLETED'),
        ('seed.client07@royalknot.local', 'Kabir Choudhary & Vanya Rathore', 'Jaipur', 'Alila Fort Bishangarh', 'Full-Service', DATE '2026-07-17', DATE '2026-07-19', 550, 35000000, 'COMPLETED'),
        ('seed.client08@royalknot.local', 'Aditya Agarwal & Myra Agarwal', 'Udaipur', 'Jagmandir Island Palace', 'Full-Service', DATE '2026-08-14', DATE '2026-08-16', 410, 26000000, 'COMPLETED'),
        ('seed.client09@royalknot.local', 'Arjun Bansal & Tara Mittal', 'Jaipur', 'Samode Palace', 'Partial/Day-of', DATE '2026-09-11', DATE '2026-09-13', 620, 40000000, 'COMPLETED'),
        ('seed.client10@royalknot.local', 'Yuvraj Shekhawat & Kiara Shekhawat', 'Udaipur', 'Fateh Garh', 'Full-Service', DATE '2026-10-30', DATE '2026-11-01', 500, 32000000, 'LIVE'),
        ('seed.client11@royalknot.local', 'Veer Sethi & Aisha Sethi', 'Jaipur', 'The Raj Palace', 'Full-Service', DATE '2026-11-06', DATE '2026-11-08', 450, 28500000, 'CONFIRMED'),
        ('seed.client12@royalknot.local', 'Nikhil Purohit & Aadhya Purohit', 'Udaipur', 'Trident Udaipur', 'Partial/Day-of', DATE '2026-11-13', DATE '2026-11-15', 580, 36000000, 'IN_PLANNING'),
        ('seed.client13@royalknot.local', 'Reyansh Joshi & Isha Joshi', 'Jaipur', 'Rajasthali Resort', 'Full-Service', DATE '2026-11-20', DATE '2026-11-22', 720, 47000000, 'IN_PLANNING'),
        ('seed.client14@royalknot.local', 'Dev Desai & Pari Desai', 'Udaipur', 'Chunda Palace', 'Full-Service', DATE '2026-11-27', DATE '2026-11-29', 400, 25000000, 'CONFIRMED'),
        ('seed.client15@royalknot.local', 'Dhruv Bhati & Rhea Rathore', 'Jaipur', 'Shiv Vilas Resort', 'Full-Service', DATE '2026-12-04', DATE '2026-12-06', 640, 41000000, 'IN_PLANNING'),
        ('seed.client16@royalknot.local', 'Aman Khandelwal & Tara Khandelwal', 'Udaipur', 'Ramada Udaipur Resort', 'Partial/Day-of', DATE '2026-12-11', DATE '2026-12-13', 470, 29500000, 'IN_PLANNING'),
        ('seed.client17@royalknot.local', 'Vivaan Rathore & Siya Rathore', 'Jaipur', 'Le Meridien Jaipur Resort', 'Full-Service', DATE '2026-12-18', DATE '2026-12-20', 800, 52000000, 'IN_PLANNING'),
        ('seed.client18@royalknot.local', 'Aarav Mathur & Ira Mathur', 'Udaipur', 'Bhairavgarh Palace', 'Full-Service', DATE '2026-12-25', DATE '2026-12-27', 530, 34000000, 'CONFIRMED'),
        ('seed.client19@royalknot.local', 'Advik Goyal & Shanaya Goyal', 'Jaipur', 'Buena Vista Luxury Garden Spa Resort', 'Full-Service', DATE '2027-01-08', DATE '2027-01-10', 490, 31000000, 'IN_PLANNING'),
        ('seed.client20@royalknot.local', 'Karan Solanki & Meera Solanki', 'Udaipur', 'Heritage Resort', 'Partial/Day-of', DATE '2027-01-15', DATE '2027-01-17', 560, 35500000, 'PROPOSED'),
        ('seed.client21@royalknot.local', 'Krish Vyas & Radhika Vyas', 'Jaipur', 'Narain Niwas Palace', 'Full-Service', DATE '2027-02-05', DATE '2027-02-07', 680, 44000000, 'IN_PLANNING'),
        ('seed.client22@royalknot.local', 'Samar Chawla & Navya Chawla', 'Udaipur', 'The Lalit Laxmi Vilas Palace', 'Full-Service', DATE '2027-02-19', DATE '2027-02-21', 420, 27000000, 'PROPOSED'),
        ('seed.client23@royalknot.local', 'Shaurya Tanwar & Pihu Tanwar', 'Jaipur', 'Hotel Diggi Palace', 'Partial/Day-of', DATE '2027-03-05', DATE '2027-03-07', 510, 32500000, 'ENQUIRY'),
        ('seed.client24@royalknot.local', 'Neil Parekh & Riya Parekh', 'Udaipur', 'The Westin Udaipur Resort & Spa', 'Full-Service', DATE '2027-03-19', DATE '2027-03-21', 750, 49000000, 'IN_PLANNING'),
        ('seed.client25@royalknot.local', 'Atharv Jain & Sanaya Jain', 'Jaipur', 'The Tree of Life Resort & Spa', 'Full-Service', DATE '2027-04-02', DATE '2027-04-04', 440, 28000000, 'ENQUIRY')
    ) AS seed(client_email, couple_name, city, destination_venue, package_type, start_date, end_date, estimated_guests, max_budget, status)
)
INSERT INTO weddings (
    client_id, couple_name, city, destination_venue, package_type,
    start_date, end_date, estimated_guests, max_budget, status
)
SELECT
    clients.client_id, seed_weddings.couple_name, seed_weddings.city,
    seed_weddings.destination_venue, seed_weddings.package_type,
    seed_weddings.start_date, seed_weddings.end_date,
    seed_weddings.estimated_guests, seed_weddings.max_budget, seed_weddings.status
FROM seed_weddings
JOIN clients ON clients.email = seed_weddings.client_email
WHERE NOT EXISTS (
    SELECT 1
    FROM weddings existing
    WHERE existing.client_id = clients.client_id
      AND existing.couple_name = seed_weddings.couple_name
      AND existing.start_date = seed_weddings.start_date
);

INSERT INTO vendors (business_name, category, contact_name, phone, email, rating, is_active)
SELECT seed.business_name, seed.category, seed.contact_name, seed.phone, seed.email, seed.rating, TRUE
FROM (VALUES
    ('Saffron & Sage Catering', 'CATERER', 'Raghav Bhatia', '9876510001', 'catering1@royalknot.local', 4.90),
    ('The Marigold Table', 'CATERER', 'Pooja Menon', '9876510002', 'catering2@royalknot.local', 4.80),
    ('Royal Thali Collective', 'CATERER', 'Manav Bedi', '9876510003', 'catering3@royalknot.local', 4.70),
    ('Rajwada Decor House', 'DECORATOR', 'Ila Rathore', '9876510004', 'decor1@royalknot.local', 4.90),
    ('Genda & Gold Designs', 'DECORATOR', 'Ritesh Soni', '9876510005', 'decor2@royalknot.local', 4.80),
    ('Desert Beat Productions', 'DJ_SOUND', 'Nakul Arora', '9876510006', 'sound1@royalknot.local', 4.70),
    ('Sur Taal Events', 'DJ_SOUND', 'Nisha Khurana', '9876510007', 'sound2@royalknot.local', 4.60),
    ('Phool Mahal Florals', 'FLORIST', 'Gauri Parekh', '9876510008', 'florist1@royalknot.local', 4.90),
    ('Petal & Pichwai Studio', 'FLORIST', 'Harsh Vora', '9876510009', 'florist2@royalknot.local', 4.80),
    ('Sunehri Frames', 'PHOTOGRAPHER', 'Amit Dutt', '9876510010', 'photo1@royalknot.local', 4.90),
    ('Mosaic Wedding Films', 'PHOTOGRAPHER', 'Leena Suri', '9876510011', 'photo2@royalknot.local', 4.80),
    ('Blush Jaipur Artistry', 'MAKEUP', 'Simran Gill', '9876510012', 'makeup1@royalknot.local', 4.90),
    ('Kohl & Kundan Beauty', 'MAKEUP', 'Ritu Khanna', '9876510013', 'makeup2@royalknot.local', 4.70),
    ('Mewar Luxury Coaches', 'TRANSPORT', 'Vikram Singh', '9876510014', 'transport1@royalknot.local', 4.80),
    ('Pink City Fleet', 'TRANSPORT', 'Sahil Jain', '9876510015', 'transport2@royalknot.local', 4.70),
    ('Mehendi by Noor', 'MEHENDI_ARTIST', 'Noor Sheikh', '9876510016', 'mehendi1@royalknot.local', 4.90),
    ('Rangrez Henna Collective', 'MEHENDI_ARTIST', 'Farah Khan', '9876510017', 'mehendi2@royalknot.local', 4.80),
    ('Amber Heritage Experiences', 'DECORATOR', 'Keshav Sharma', '9876510018', 'decor3@royalknot.local', 4.60)
) AS seed(business_name, category, contact_name, phone, email, rating)
WHERE NOT EXISTS (
    SELECT 1
    FROM vendors existing
    WHERE existing.business_name = seed.business_name
      AND existing.contact_name = seed.contact_name
);

INSERT INTO agreements (wedding_id, contract_terms, signed_by_name, signed_at, status)
SELECT weddings.wedding_id,
       'Royal Knot planning agreement for ' || weddings.couple_name || '. Final scope and payment milestones to be confirmed with the client.',
       CASE
           WHEN weddings.status IN ('CONFIRMED', 'IN_PLANNING', 'LIVE', 'COMPLETED') THEN clients.name
           ELSE NULL
       END,
       CASE
           WHEN weddings.status IN ('CONFIRMED', 'IN_PLANNING', 'LIVE', 'COMPLETED')
               THEN weddings.start_date::TIMESTAMP - INTERVAL '90 days'
           ELSE NULL
       END,
       CASE
           WHEN weddings.status IN ('CONFIRMED', 'IN_PLANNING', 'LIVE', 'COMPLETED') THEN 'SIGNED'
           ELSE 'PENDING'
       END
FROM weddings
JOIN clients ON clients.client_id = weddings.client_id
WHERE clients.email LIKE 'seed.client%@royalknot.local'
  AND NOT EXISTS (
      SELECT 1 FROM agreements existing
      WHERE existing.wedding_id = weddings.wedding_id
  );

INSERT INTO vendor_quotes (
    wedding_id, vendor_id, category, price_per_plate,
    extra_hour_rate, total_amount, proposal_notes, status
)
SELECT weddings.wedding_id,
       vendors.vendor_id,
       'CATERER',
       caterers.price_per_plate,
       caterers.extra_hour_rate,
       caterers.price_per_plate * weddings.estimated_guests,
       caterers.proposal_notes,
       'SUBMITTED'
FROM weddings
JOIN clients ON clients.client_id = weddings.client_id
CROSS JOIN (VALUES
    ('Saffron & Sage Catering', 2600.00::NUMERIC, 18000.00::NUMERIC, 'Seasonal Rajasthani and international menu; three-day service.'),
    ('The Marigold Table', 2850.00::NUMERIC, 20000.00::NUMERIC, 'Live cooking stations and regional tasting menu.'),
    ('Royal Thali Collective', 2400.00::NUMERIC, 16000.00::NUMERIC, 'Traditional royal thali with vegetarian and non-vegetarian service.')
) AS caterers(business_name, price_per_plate, extra_hour_rate, proposal_notes)
JOIN vendors ON vendors.business_name = caterers.business_name
WHERE clients.email LIKE 'seed.client%@royalknot.local'
  AND NOT EXISTS (
      SELECT 1 FROM vendor_quotes existing
      WHERE existing.wedding_id = weddings.wedding_id
        AND existing.vendor_id = vendors.vendor_id
        AND existing.category = 'CATERER'
  );

INSERT INTO day_schedule_events (
    wedding_id, title, event_time, location, responsible_person, status
)
SELECT weddings.wedding_id,
       events.title,
       events.event_time,
       weddings.destination_venue,
       'Royal Knot Event Lead',
       CASE
           WHEN weddings.status = 'COMPLETED' THEN 'COMPLETED'
           WHEN weddings.status = 'LIVE' AND events.event_order = 2 THEN 'ACTIVE'
           ELSE 'PENDING'
       END
FROM weddings
JOIN clients ON clients.client_id = weddings.client_id
CROSS JOIN (VALUES
    (1, 'Groom Baraat', '16:00'),
    (2, 'Varmala', '18:00'),
    (3, 'Pheras', '21:00'),
    (4, 'Reception', '22:30')
) AS events(event_order, title, event_time)
WHERE clients.email LIKE 'seed.client%@royalknot.local'
  AND NOT EXISTS (
      SELECT 1 FROM day_schedule_events existing
      WHERE existing.wedding_id = weddings.wedding_id
        AND existing.title = events.title
        AND existing.event_time = events.event_time
  );

INSERT INTO vendor_checkins (
    wedding_id, vendor_id, scheduled_arrival_time, actual_arrival_time, status, notes_remarks
)
SELECT weddings.wedding_id,
       vendors.vendor_id,
       '08:00',
       CASE WHEN weddings.status IN ('COMPLETED', 'LIVE') THEN '07:50' ELSE NULL END,
       CASE WHEN weddings.status IN ('COMPLETED', 'LIVE') THEN 'ARRIVED' ELSE 'PENDING' END,
       'Catering team arrival check-in.'
FROM weddings
JOIN clients ON clients.client_id = weddings.client_id
JOIN vendors ON vendors.business_name = 'Saffron & Sage Catering'
WHERE clients.email LIKE 'seed.client%@royalknot.local'
  AND NOT EXISTS (
      SELECT 1 FROM vendor_checkins existing
      WHERE existing.wedding_id = weddings.wedding_id
        AND existing.vendor_id = vendors.vendor_id
        AND existing.scheduled_arrival_time = '08:00'
  );

INSERT INTO extra_expenses (
    wedding_id, vendor_id, description, extra_units, unit_rate, total_amount, billed_to_client
)
SELECT weddings.wedding_id,
       NULL,
       'Additional banquet guests',
       60,
       2200.00,
       60 * 2200.00,
       TRUE
FROM weddings
JOIN clients ON clients.client_id = weddings.client_id
WHERE clients.email LIKE 'seed.client%@royalknot.local'
  AND weddings.status = 'COMPLETED'
  AND NOT EXISTS (
      SELECT 1 FROM extra_expenses existing
      WHERE existing.wedding_id = weddings.wedding_id
        AND existing.description = 'Additional banquet guests'
  );

COMMIT;
