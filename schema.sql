DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS plans;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  visibleTo TEXT NOT NULL
);

INSERT INTO plans (title, date, description, status, visibleTo) VALUES 
('Vocal Warm-up Routine', '2023-10-25', 'Standard 15-minute warm-up focusing on breath control.', 'Done', '["Teacher","Leader","Part Leader","Member"]'),
('Sectionals: Soprano & Alto', '2023-10-27', 'Focus on the bridge of "O Magnum Mysterium".', 'Done', '["Teacher","Part Leader"]'),
('Full Choir Rehearsal', '2023-11-01', 'Run through of the Christmas concert repertoire.', 'Planned', '["Teacher","Leader","Part Leader","Member"]'),
('Leadership Meeting', '2023-11-05', 'Discussing logistics for the upcoming tour.', 'Planned', '["Teacher","Leader"]'),
('Tenor Sectional', '2023-11-08', 'Learning the new piece "Stars".', 'Planned', '["Teacher","Part Leader"]');
