#!/usr/bin/env node

/**
 * Super Admin Promotion Helper
 * This script provides SQL commands to promote a user to super admin
 */

console.log('🔧 Super Admin Promotion Helper');
console.log('===============================');
console.log('');
console.log('After running the migration, follow these steps to create a super admin:');
console.log('');
console.log('1. Go to Supabase Dashboard > Authentication > Users');
console.log('2. Find your user and copy their User ID');
console.log('3. Run this SQL in the SQL Editor:');
console.log('');
console.log('-- Replace YOUR_USER_ID with the actual user ID from step 2');
console.log('UPDATE profiles SET role = \'super_admin\' WHERE id = \'YOUR_USER_ID\';');
console.log('');
console.log('4. If the user doesn\'t have a profile yet, create one:');
console.log('');
console.log('-- Replace YOUR_USER_ID with the actual user ID');
console.log('INSERT INTO profiles (id, role, created_at, updated_at)');
console.log('VALUES (\'YOUR_USER_ID\', \'super_admin\', NOW(), NOW());');
console.log('');
console.log('5. Test by logging in with that user');
console.log('');
console.log('🎉 Your super admin is ready!');
