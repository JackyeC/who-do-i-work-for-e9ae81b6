
-- Consolidate industry categories into clean canonical labels

-- Finance consolidation
UPDATE companies SET industry = 'Financial Services' WHERE industry IN ('Finance', 'Banking', 'Insurance', 'Financial Technology (FinTech), Cryptocurrency', 'HR Tech / Fintech');

-- Technology consolidation
UPDATE companies SET industry = 'Technology' WHERE industry IN ('Software', 'Software Development', 'Software & Tech Services', 'Information Technology', 'Information Technology and Services', 'Artificial Intelligence', 'AI / Technology', 'Cybersecurity', 'Green Technology', 'IoT Hardware, Smart Home Technology', 'Internet Services, Domain Registrar, Web Hosting', 'Cloud Computing, Infrastructure as a Service, Platform as a Service', 'Software, Data Analytics, Artificial Intelligence', 'Social Media, Entertainment, Technology', 'Human Resources Software', 'Software, Human Resources Technology', 'Healthcare AI', 'Pet Services & Technology');

-- Semiconductors consolidation
UPDATE companies SET industry = 'Semiconductors' WHERE industry IN ('Semiconductor Manufacturing', 'Semiconductor & Software', 'Semiconductor manufacturing equipment', 'Semiconductor and Telecommunications Equipment', 'Semiconductor Equipment Manufacturing');

-- Telecom consolidation
UPDATE companies SET industry = 'Telecommunications' WHERE industry IN ('Telecom');

-- Aerospace & Defense consolidation
UPDATE companies SET industry = 'Aerospace & Defense' WHERE industry IN ('Aerospace', 'Defense');

-- Energy consolidation
UPDATE companies SET industry = 'Energy' WHERE industry IN ('Energy and Utilities', 'Oil and Gas', 'Renewable Energy', 'Energy / AI');

-- Retail consolidation
UPDATE companies SET industry = 'Retail' WHERE industry IN ('Retail & Apparel', 'Specialty Retail', 'Apparel Retail', 'Retail - Sporting Goods', 'Retail - Convenience Stores', 'Retail (Arts & Crafts)', 'Retail, Home Goods, Media, Hospitality', 'Grocery Retail', 'Grocery Stores', 'Grocery', 'Sportswear & Footwear', 'Apparel, Footwear and Accessories', 'Sporting Goods Manufacturing', 'Pet Store, Retail, Animal Health');

-- Food & Beverage consolidation
UPDATE companies SET industry = 'Food & Beverage' WHERE industry IN ('Fast Food / Restaurant', 'Fast Food Restaurants', 'Fast Food Restaurant', 'Restaurant & Dairy', 'Beverage Manufacturing', 'Food & Beverage, Petcare, Confectionery', 'Tobacco');

-- Media & Entertainment consolidation
UPDATE companies SET industry = 'Media & Entertainment' WHERE industry IN ('Media', 'Television Broadcasting', 'Digital Media Distribution (Animation)', 'Entertainment (Motion Picture Exhibition)', 'Toys and Games, Entertainment');

-- HR Technology consolidation  
UPDATE companies SET industry = 'HR Technology' WHERE industry IN ('Human Resources Consulting');

-- Education consolidation
UPDATE companies SET industry = 'Education' WHERE industry IN ('Higher Education', 'Education Management', 'K-12 Education');

-- Non-profit consolidation
UPDATE companies SET industry = 'Non-profit' WHERE industry IN ('Non-profit Organization', 'Non-profit / Retail', 'Philanthropy/Non-profit');

-- Healthcare consolidation
UPDATE companies SET industry = 'Healthcare' WHERE industry IN ('Senior Living', 'Veterinary Services');

-- Government consolidation
UPDATE companies SET industry = 'Government' WHERE industry IN ('Government Administration');

-- Consumer Goods consolidation (McDonald's etc should be Food & Beverage)
UPDATE companies SET industry = 'Food & Beverage' WHERE industry = 'Consumer Goods' AND name IN ('McDonald''s', 'Anheuser-Busch InBev', 'Coca-Cola', 'PepsiCo', 'Philip Morris (Altria)');

-- Fix misc
UPDATE companies SET industry = 'Retail' WHERE industry = 'E-commerce, Nutritional Supplements';
UPDATE companies SET industry = 'Healthcare' WHERE industry = 'Private Prison / Detention Services' OR industry = 'Private Prisons';
UPDATE companies SET industry = 'Technology' WHERE industry = 'unknown';
UPDATE companies SET industry = 'Technology' WHERE industry = 'Pending Verification';
