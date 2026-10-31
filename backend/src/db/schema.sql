CREATE TABLE IF NOT EXISTS clients (
    client_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS weddings (
    wedding_id SERIAL PRIMARY KEY,
    client_id INT REFERENCES clients(client_id) ON DELETE CASCADE,
    couple_name VARCHAR(200) NOT NULL,
    city VARCHAR(100) NOT NULL CHECK (city IN ('Jaipur', 'Udaipur', 'Jodhpur')),
    destination_venue VARCHAR(200) NOT NULL,
    package_type VARCHAR(50) NOT NULL CHECK (package_type IN ('Full-Service', 'Partial/Day-of')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    estimated_guests INT NOT NULL CHECK (estimated_guests > 0),
    max_budget NUMERIC(12, 2) NOT NULL CHECK (max_budget > 0),
    actual_cost NUMERIC(12, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'ENQUIRY' CHECK (status IN ('ENQUIRY', 'PROPOSED', 'CONFIRMED', 'IN_PLANNING', 'LIVE', 'COMPLETED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT weddings_end_date_on_or_after_start_date CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS agreements (
    agreement_id SERIAL PRIMARY KEY,
    wedding_id INT REFERENCES weddings(wedding_id) ON DELETE CASCADE,
    contract_terms TEXT NOT NULL,
    signed_by_name VARCHAR(150),
    signature_data TEXT,
    signed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SIGNED', 'REJECTED'))
);

CREATE TABLE IF NOT EXISTS vendors (
    vendor_id SERIAL PRIMARY KEY,
    business_name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('CATERER', 'DECORATOR', 'DJ_SOUND', 'FLORIST', 'PHOTOGRAPHER', 'MAKEUP', 'TRANSPORT', 'MEHENDI_ARTIST')),
    contact_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150) NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 5.00 CHECK (rating >= 1.0 AND rating <= 5.0),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS vendor_quotes (
    quote_id SERIAL PRIMARY KEY,
    wedding_id INT REFERENCES weddings(wedding_id) ON DELETE CASCADE,
    vendor_id INT REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    price_per_plate NUMERIC(10, 2) DEFAULT 0.00,
    extra_hour_rate NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL,
    proposal_notes TEXT,
    status VARCHAR(50) DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'ACCEPTED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wedding_tasks (
    task_id SERIAL PRIMARY KEY,
    wedding_id INT REFERENCES weddings(wedding_id) ON DELETE CASCADE,
    title VARCHAR(250) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('VENUE', 'DESIGN_DECOR', 'VENDORS', 'MEHENDI', 'SANGEET', 'WEDDING_CEREMONY', 'RECEPTION')),
    owner_name VARCHAR(100) NOT NULL,
    stage VARCHAR(50) DEFAULT 'TO_PLAN' CHECK (stage IN ('TO_PLAN', 'IN_PROGRESS', 'DONE')),
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS day_schedule_events (
    event_id SERIAL PRIMARY KEY,
    wedding_id INT REFERENCES weddings(wedding_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    event_time VARCHAR(20) NOT NULL,
    location VARCHAR(150) NOT NULL,
    responsible_person VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'COMPLETED', 'DELAYED'))
);

CREATE TABLE IF NOT EXISTS vendor_checkins (
    checkin_id SERIAL PRIMARY KEY,
    wedding_id INT REFERENCES weddings(wedding_id) ON DELETE CASCADE,
    vendor_id INT REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    scheduled_arrival_time VARCHAR(20) NOT NULL,
    actual_arrival_time VARCHAR(20),
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ARRIVED', 'DELAYED')),
    notes_remarks TEXT
);

CREATE TABLE IF NOT EXISTS payments (
    payment_id SERIAL PRIMARY KEY,
    wedding_id INT REFERENCES weddings(wedding_id) ON DELETE CASCADE,
    stage_type VARCHAR(50) NOT NULL CHECK (stage_type IN ('BOOKING_DEPOSIT', 'ADVANCE_1MONTH', 'FINAL_BALANCE')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    paid_date DATE,
    status VARCHAR(50) DEFAULT 'DUE' CHECK (status IN ('DUE', 'PAID', 'OVERDUE')),
    payment_method VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS extra_expenses (
    expense_id SERIAL PRIMARY KEY,
    wedding_id INT REFERENCES weddings(wedding_id) ON DELETE CASCADE,
    vendor_id INT REFERENCES vendors(vendor_id) ON DELETE SET NULL,
    description VARCHAR(250) NOT NULL,
    extra_units INT DEFAULT 1,
    unit_rate NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    billed_to_client BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS weddings_client_id_idx ON weddings(client_id);
CREATE INDEX IF NOT EXISTS weddings_status_start_date_idx ON weddings(status, start_date);
CREATE INDEX IF NOT EXISTS agreements_wedding_id_idx ON agreements(wedding_id);
CREATE INDEX IF NOT EXISTS vendor_quotes_wedding_category_status_idx ON vendor_quotes(wedding_id, category, status);
CREATE INDEX IF NOT EXISTS vendor_quotes_vendor_id_idx ON vendor_quotes(vendor_id);
CREATE INDEX IF NOT EXISTS wedding_tasks_wedding_stage_idx ON wedding_tasks(wedding_id, stage);
CREATE INDEX IF NOT EXISTS day_schedule_events_wedding_time_idx ON day_schedule_events(wedding_id, event_time);
CREATE INDEX IF NOT EXISTS vendor_checkins_wedding_id_idx ON vendor_checkins(wedding_id);
CREATE INDEX IF NOT EXISTS vendor_checkins_vendor_id_idx ON vendor_checkins(vendor_id);
CREATE INDEX IF NOT EXISTS payments_wedding_status_due_date_idx ON payments(wedding_id, status, due_date);
CREATE INDEX IF NOT EXISTS extra_expenses_wedding_id_idx ON extra_expenses(wedding_id);
CREATE INDEX IF NOT EXISTS extra_expenses_vendor_id_idx ON extra_expenses(vendor_id);
