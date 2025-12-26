-- Seed / update admin user password (bcrypt hash)
INSERT INTO "User" ("id", "username", "passwordHash", "createdAt", "updatedAt")
VALUES (
  '1',
  'admin',
  '$2b$10$rlfdvPupDcBrS6t6A3PapetmUudmOL1t6U11XtJcRyuoOwc3HnAj.',
  NOW(),
  NOW()
)
ON CONFLICT ("username")
DO UPDATE SET
  "passwordHash" = EXCLUDED."passwordHash",
  "updatedAt" = NOW();
