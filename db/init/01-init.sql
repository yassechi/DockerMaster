CREATE TABLE IF NOT EXISTS tajines (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  meat TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  spice_level INTEGER NOT NULL DEFAULT 1 CHECK (spice_level BETWEEN 1 AND 5),
  is_signature BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  guests INTEGER NOT NULL CHECK (guests > 0),
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tajines_slug ON tajines (slug);
CREATE INDEX IF NOT EXISTS idx_reservations_date_time ON reservations (reservation_date, reservation_time);

INSERT INTO tajines (slug, name, description, meat, price, currency, spice_level, is_signature)
VALUES
  (
    'tajine-atlas',
    'Tajine Atlas',
    'Agneau braise, pruneaux fondants, cannelle et graines torrefiees.',
    'agneau',
    24.00,
    'EUR',
    2,
    TRUE
  ),
  (
    'tajine-citron-olives',
    'Tajine citron olives',
    'Poulet fermier, citron confit, olives vertes et sauce brillante.',
    'poulet',
    23.00,
    'EUR',
    1,
    TRUE
  ),
  (
    'tajine-kefta',
    'Tajine kefta',
    'Boulettes epicees, oeufs coulants et tomate mijotee lentement.',
    'boeuf',
    21.00,
    'EUR',
    3,
    FALSE
  ),
  (
    'tajine-vegetarien',
    'Tajine vegetarien',
    'Carottes, courgettes, pois chiches, abricots et bouillon safrane.',
    'vegetarien',
    19.00,
    'EUR',
    1,
    FALSE
  ),
  (
    'tajine-royal',
    'Tajine Royal',
    'Veau fondant, oignons confits, amandes et reduction aux epices douces.',
    'veau',
    26.00,
    'EUR',
    2,
    TRUE
  )
ON CONFLICT (slug) DO NOTHING;
