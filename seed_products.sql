-- Ensure your products table exists first. If not, refer to the walkthrough for the table creation code.

INSERT INTO public.products (name, category, image_url, description, specs) VALUES
-- Sample Product 1 (Window)
('Alumina Thermal Window', 'Windows', '/images/Interior 2.webp', 'High-end thermal insulated window designed for extreme weather conditions.', '{"Energy Rating": "A++", "Glazing": "Triple Low-E", "Frame Style": "Minimalist Hidden Sash"}'),

-- Sample Product 2 (Window System)
('Horizon Fold System', 'Windows & Sliding', '/images/Interior 1.webp', 'Bi-folding panoramic system allowing complete opening of your space to the outdoors.', '{"Mechanism": "Bottom Rolling", "Max Leaf Width": "1200mm", "Acoustics": "Up to 40 dB"}'),

-- Sample Product 3 (Door)
('Villa Grand Entrance', 'Doors', '/images/glass entrance door.webp', 'A massive, luxurious glass and aluminum entrance door featuring integrated smart locks.', '{"Security": "Class RC3", "Glass Type": "Frosted Toughened", "Hardware": "Motorized Multi-point"}'),

-- Sample Product 4 (Specialty)
('Commercial Curtain Wall', 'Specialty', '/images/Rectangle 87.webp', 'Continuous grid facade system for high-rise commercial structures.', '{"Mullion Depth": "150mm", "Integration": "Photovoltaic Panels", "Wind Load": "Up to 3000 Pa"}');
