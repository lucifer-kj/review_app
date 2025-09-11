const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDatabaseIssues() {
  try {
    console.log('🔧 Fixing database issues...');
    
    // Test current tenant function
    console.log('🧪 Testing get_current_tenant_id function...');
    const { data: tenantTest, error: tenantError } = await supabase.rpc('get_current_tenant_id');
    
    if (tenantError) {
      console.log(`❌ get_current_tenant_id error: ${tenantError.message}`);
    } else {
      console.log(`✅ get_current_tenant_id working: ${tenantTest}`);
    }
    
    // Test profiles query
    console.log('🧪 Testing profiles query...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, tenant_id, role')
      .limit(5);
    
    if (profilesError) {
      console.log(`❌ Profiles query error: ${profilesError.message}`);
    } else {
      console.log(`✅ Profiles query working: ${profiles.length} profiles found`);
    }
    
    // Test tenants query
    console.log('🧪 Testing tenants query...');
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name, status')
      .limit(5);
    
    if (tenantsError) {
      console.log(`❌ Tenants query error: ${tenantsError.message}`);
    } else {
      console.log(`✅ Tenants query working: ${tenants.length} tenants found`);
    }
    
    // Test business_settings query
    console.log('🧪 Testing business_settings query...');
    const { data: settings, error: settingsError } = await supabase
      .from('business_settings')
      .select('id, tenant_id, business_name')
      .limit(5);
    
    if (settingsError) {
      console.log(`❌ Business settings query error: ${settingsError.message}`);
    } else {
      console.log(`✅ Business settings query working: ${settings.length} settings found`);
    }
    
    console.log('✅ Database tests completed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

fixDatabaseIssues();
