import mysql from 'mysql2/promise';

if (!process.env.DATABASE_URL) {
	console.error('DATABASE_URL is not set');
	process.exit(1);
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
	console.log('Running migration: Adding full_name column...');
	
	// Step 1: Add column as nullable
	await connection.execute('ALTER TABLE `user` ADD `full_name` varchar(255) NULL');
	console.log('✓ Added full_name column (nullable)');
	
	// Step 2: Update existing users
	const [updateResult] = await connection.execute('UPDATE `user` SET `full_name` = `username` WHERE `full_name` IS NULL');
	console.log(`✓ Updated ${updateResult.affectedRows} existing users`);
	
	// Step 3: Make it NOT NULL
	await connection.execute('ALTER TABLE `user` MODIFY `full_name` varchar(255) NOT NULL');
	console.log('✓ Made full_name NOT NULL');
	
	console.log('✅ Migration completed successfully!');
} catch (error) {
	if (error.code === 'ER_DUP_FIELDNAME') {
		console.log('⚠ Column full_name already exists. Skipping migration.');
	} else {
		console.error('❌ Migration failed:', error.message);
		process.exit(1);
	}
} finally {
	await connection.end();
}

