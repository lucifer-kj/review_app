/**
 * Fix missing plan_type column in tenants table
 * Simple approach using direct SQL execution
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL');
  console.error('   VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixPlanTypeColumn() {
  try {
    console.log('🔧 Fixing missing plan_type column in tenants table...');
    
    // Step 1: Add plan_type column
    console.log('📝 Adding plan_type column...');
    const { error: addColumnError } = await supabase.rpc('exec', {
      sql: `
        ALTER TABLE public.tenants 
        ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'basic' CHECK (plan_type IN ('basic', 'pro', 'enterprise'));
      `
    });
    
    if (addColumnError) {
      console.error('❌ Failed to add plan_type column:', addColumnError);
      return false;
    }
    
    console.log('✅ plan_type column added');
    
    // Step 2: Update existing tenants
    console.log('📝 Updating existing tenants...');
    const { error: updateError } = await supabase
      .from('tenants')
      .update({ plan_type: 'basic' })
      .is('plan_type', null);
    
    if (updateError) {
      console.error('❌ Failed to update existing tenants:', updateError);
      return false;
    }
    
    console.log('✅ Existing tenants updated');
    
    // Step 3: Make column NOT NULL
    console.log('📝 Making plan_type NOT NULL...');
    const { error: notNullError } = await supabase.rpc('exec', {
      sql: `
        ALTER TABLE public.tenants 
        ALTER COLUMN plan_type SET NOT NULL;
      `
    });
    
    if (notNullError) {
      console.error('❌ Failed to make plan_type NOT NULL:', notNullError);
      return false;
    }
    
    console.log('✅ plan_type column is now NOT NULL');
    
    // Step 4: Verify the fix
    console.log('🔍 Verifying the fix...');
    const { data: testTenant, error: testError } = await supabase
      .from('tenants')
      .insert({
        name: 'Test Tenant Fix',
        plan_type: 'pro',
        settings: { test: true }
      })
      .select()
      .single();
    
    if (testError) {
      console.error('❌ Test tenant creation failed:', testError);
      return false;
    }
    
    console.log('✅ Test tenant created successfully!');
    console.log('   ID:', testTenant.id);
    console.log('   Name:', testTenant.name);
    console.log('   Plan Type:', testTenant.plan_type);
    
    // Clean up test tenant
    await supabase
      .from('tenants')
      .delete()
      .eq('id', testTenant.id);
    
    console.log('🧹 Test tenant cleaned up');
    
    console.log('\n🎉 Fix completed successfully!');
    console.log('   The tenants table now has the plan_type column');
    console.log('   Tenant creation should work properly now');
    
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run the fix
fixPlanTypeColumn()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
