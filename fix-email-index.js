// Migration script to fix email index issue
// Run this once to drop the old email index and create a new sparse one

require('dotenv').config();
const mongoose = require('mongoose');

async function fixEmailIndex() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        console.log('Checking existing indexes...');
        const indexes = await usersCollection.indexes();
        console.log('Current indexes:', JSON.stringify(indexes, null, 2));

        // Drop the email index if it exists
        try {
            console.log('Attempting to drop email_1 index...');
            await usersCollection.dropIndex('email_1');
            console.log('Successfully dropped email_1 index');
        } catch (error) {
            if (error.code === 27) {
                console.log('Index email_1 does not exist, skipping...');
            } else {
                throw error;
            }
        }

        // Create new sparse unique index on email
        console.log('Creating new sparse unique index on email...');
        await usersCollection.createIndex(
            { email: 1 },
            { unique: true, sparse: true }
        );
        console.log('Successfully created sparse unique index on email');

        console.log('\nFinal indexes:');
        const finalIndexes = await usersCollection.indexes();
        console.log(JSON.stringify(finalIndexes, null, 2));

        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

fixEmailIndex();
