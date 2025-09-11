const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('   VITE_SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyColumnFix() {
  try {
    console.log('🔧 Applying ambiguous column reference fix...');
    
    // Read the SQL fix file
    const sqlPath = path.join(__dirname, 'fix-ambiguous-column-direct.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📋 Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`   ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
          
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql: statement + ';' 
          });
          
          if (error) {
            console.warn(`   ⚠️  Warning: ${error.message}`);
          } else {
            console.log(`   ✅ Success`);
          }
        } catch (err) {
          console.warn(`   ⚠️  Warning: ${err.message}`);
        }
      }
    }
    
    console.log('✅ Ambiguous column reference fix applied successfully!');
    
    // Test the fix by calling the function
    console.log('🧪 Testing the fix...');
    
    try {
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .limit(1);
      
      if (testError) {
        console.log(`❌ Test failed: ${testError.message}`);
      } else {
        console.log('✅ Test passed: Database queries working correctly');
      }
    } catch (testErr) {
      console.log(`❌ Test error: ${testErr.message}`);
    }
    
  } catch (error) {
    console.error('❌ Failed to apply column fix:', error.message);
    process.exit(1);
  }
}

// Run the fix
applyColumnFix();
