-- Seed 3 sample vehicles for MLG Autohaus (idempotent)
INSERT INTO public.vehicles (make, model, year, price, mileage, fuel_type, transmission, body_type, color, engine_size, doors, featured, sold, description, images)
SELECT * FROM (VALUES
  ('BMW', '3 Series', 2021, 450000::numeric, 35000, 'Petrol', 'Automatic', 'Saloon', 'Alpine White', '2.0L', 4, true, false,
   'Immaculate 2021 BMW 3 Series. Full service history, one owner, premium package. Sport seats, navigation, parking sensors. Ready to drive away.',
   ARRAY['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=70']),
  ('Mercedes-Benz', 'C-Class', 2020, 420000::numeric, 42000, 'Petrol', 'Automatic', 'Saloon', 'Obsidian Black', '2.0L', 4, true, false,
   'Stunning 2020 Mercedes-Benz C-Class. AMG line, panoramic roof, ambient lighting, full leather. Comprehensive warranty included.',
   ARRAY['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&q=70']),
  ('Toyota', 'Hilux', 2022, 580000::numeric, 15000, 'Diesel', 'Automatic', 'Pickup', 'Silver', '2.8L', 4, true, false,
   '2022 Toyota Hilux Double Cab. Low mileage, 4x4, tow bar, canopy fitted. Perfect work and family vehicle.',
   ARRAY['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&q=70'])
) AS v(make, model, year, price, mileage, fuel_type, transmission, body_type, color, engine_size, doors, featured, sold, description, images)
WHERE NOT EXISTS (
  SELECT 1 FROM public.vehicles WHERE make = v.make AND model = v.model AND year = v.year
);