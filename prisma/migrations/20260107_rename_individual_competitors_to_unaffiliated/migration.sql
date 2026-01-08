-- Update existing "Individual Competitors" teams to "Unaffiliated"
UPDATE "Team"
SET "name" = 'Unaffiliated'
WHERE "isIndividualTeam" = true
  AND "name" = 'Individual Competitors';
