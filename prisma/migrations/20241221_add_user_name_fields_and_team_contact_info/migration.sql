-- Add firstName, lastName, and phone to User table
ALTER TABLE User ADD COLUMN firstName TEXT;
ALTER TABLE User ADD COLUMN lastName TEXT;
ALTER TABLE User ADD COLUMN phone TEXT;

-- Add contact and address fields to Team table
ALTER TABLE Team ADD COLUMN headCoach TEXT;
ALTER TABLE Team ADD COLUMN headCoachEmail TEXT;
ALTER TABLE Team ADD COLUMN headCoachPhone TEXT;
ALTER TABLE Team ADD COLUMN address TEXT;
ALTER TABLE Team ADD COLUMN city TEXT;
ALTER TABLE Team ADD COLUMN state TEXT;
ALTER TABLE Team ADD COLUMN zip TEXT;
