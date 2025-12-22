-- Add full_name column with default value first
ALTER TABLE `user` ADD `full_name` varchar(255) NULL;

-- Update existing users: use username as full_name if null
UPDATE `user` SET `full_name` = `username` WHERE `full_name` IS NULL;

-- Now make it NOT NULL
ALTER TABLE `user` MODIFY `full_name` varchar(255) NOT NULL;