// Debug script to check user role and authentication status
// Run this in your browser console after logging in

console.log('🔍 Debugging User Authentication and Role...');

// Check current session
supabase.auth.getSession().then(({ data: { session }, error }) => {
  if (error) {
    console.error('❌ Session error:', error);
    return;
  }
  
  if (!session) {
    console.log('❌ No active session found');
    return;
  }
  
  console.log('✅ Active session found:', {
    userId: session.user.id,
    email: session.user.email,
    expiresAt: session.expires_at
  });
  
  // Check user profile
  supabase
    .from('profiles')
    .select('id, role, created_at')
    .eq('id', session.user.id)
    .single()
    .then(({ data: profile, error: profileError }) => {
      if (profileError) {
        console.error('❌ Profile error:', profileError);
        return;
      }
      
      console.log('👤 User profile:', profile);
      
      // Check if user has required role
      const hasAccess = profile?.role === 'super_admin' || 
                       profile?.role === 'tenant_admin' || 
                       profile?.role === 'admin';
      
      console.log('🔐 Access check:', {
        role: profile?.role,
        hasAccess: hasAccess,
        requiredRoles: ['super_admin', 'tenant_admin', 'admin']
      });
      
      if (!hasAccess) {
        console.log('❌ User does not have required role for /master access');
        console.log('💡 To fix this, run the following SQL in Supabase:');
        console.log(`UPDATE profiles SET role = 'super_admin' WHERE id = '${session.user.id}';`);
      } else {
        console.log('✅ User has required role for /master access');
      }
    });
});

// Check if user exists in profiles table at all
supabase.auth.getUser().then(({ data: { user }, error }) => {
  if (error) {
    console.error('❌ User error:', error);
    return;
  }
  
  if (!user) {
    console.log('❌ No user found');
    return;
  }
  
  console.log('👤 Current user:', {
    id: user.id,
    email: user.email,
    created_at: user.created_at
  });
  
  // Check if profile exists
  supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .then(({ data: profiles, error }) => {
      if (error) {
        console.error('❌ Profiles query error:', error);
        return;
      }
      
      if (!profiles || profiles.length === 0) {
        console.log('❌ No profile found for user');
        console.log('💡 To fix this, run the following SQL in Supabase:');
        console.log(`INSERT INTO profiles (id, role) VALUES ('${user.id}', 'super_admin');`);
      } else {
        console.log('✅ Profile found:', profiles[0]);
      }
    });
});
