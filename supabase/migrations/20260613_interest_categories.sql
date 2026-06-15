-- Create interest_categories table + seed

CREATE TABLE IF NOT EXISTS interest_categories (
  id         SERIAL      PRIMARY KEY,
  slug       TEXT        NOT NULL UNIQUE,
  label      TEXT        NOT NULL,
  icon       TEXT,
  hashtags   TEXT[]      NOT NULL DEFAULT '{}',
  description TEXT,
  sort_order INT         NOT NULL DEFAULT 0
);

INSERT INTO interest_categories (slug, label, icon, hashtags, sort_order) VALUES
('technology',  'Technology',  '💻', '{}', 1),
('design',      'Design',      '🎨', '{}', 2),
('fitness',     'Fitness',     '💪', '{}', 3),
('food',        'Food',        '🍜', '{}', 4),
('travel',      'Travel',      '✈️', '{}', 5),
('music',       'Music',       '🎵', '{}', 6),
('photography', 'Photography', '📷', '{}', 7),
('gaming',      'Gaming',      '🎮', '{}', 8),
('business',    'Business',    '📈', '{}', 9),
('art',         'Art',         '🖼️', '{}', 10),
('science',     'Science',     '🔬', '{}', 11),
('fashion',     'Fashion',     '👗', '{}', 12)
ON CONFLICT (slug) DO NOTHING;
