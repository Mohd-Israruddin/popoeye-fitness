const db = require('./db');

async function testAdmin() {
    try {
        console.log('=== Testing Admin Table ===');
        
        // Check table structure
        const [columns] = await db.query('DESCRIBE admin');
        console.log('Admin table columns:');
        columns.forEach(col => {
            console.log(`- ${col.Field}: ${col.Type}`);
        });
        
        // Check existing records
        const [rows] = await db.query('SELECT * FROM admin');
        console.log('\nAdmin records found:', rows.length);
        rows.forEach((row, index) => {
            console.log(`Record ${index + 1}:`, row);
        });
        
        // Test the verification query
        const testUsername = 'admin';
        const testCode = '1234';
        console.log(`\nTesting verification for username="${testUsername}", code="${testCode}"`);
        
        const [testRows] = await db.query('SELECT * FROM admin WHERE username = ? AND passkey_hash = ?', [testUsername, testCode]);
        console.log('Test query result:', testRows.length, 'records found');
        
        if (testRows.length > 0) {
            console.log('✅ Verification would succeed');
        } else {
            console.log('❌ Verification would fail');
            
            // Let's try different queries to debug
            console.log('\n=== Debugging Queries ===');
            
            // Check just username
            const [usernameRows] = await db.query('SELECT * FROM admin WHERE username = ?', [testUsername]);
            console.log(`Records with username="${testUsername}":`, usernameRows.length);
            
            // Check just passkey_hash
            const [codeRows] = await db.query('SELECT * FROM admin WHERE passkey_hash = ?', [testCode]);
            console.log(`Records with passkey_hash="${testCode}":`, codeRows.length);
            
            // Show all records again for comparison
            console.log('\nAll admin records for comparison:');
            rows.forEach((row, index) => {
                console.log(`Record ${index + 1}: username="${row.username}", passkey_hash="${row.passkey_hash}"`);
            });
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error testing admin:', error);
        process.exit(1);
    }
}

testAdmin(); 