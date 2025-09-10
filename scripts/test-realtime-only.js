#!/usr/bin/env node

/**
 * Test Real-time Updates Only
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testRealtimeUpdates() {
  console.log('🔍 Testing real-time updates implementation');
  
  try {
    // Check if real-time hooks exist
    const subscriptionHookPath = path.join(__dirname, '..', 'src', 'hooks', 'useRealtimeSubscription.ts');
    const updatesHookPath = path.join(__dirname, '..', 'src', 'hooks', 'useRealtimeUpdates.ts');
    
    console.log('Checking subscription hook:', subscriptionHookPath);
    console.log('Exists:', fs.existsSync(subscriptionHookPath));
    
    console.log('Checking updates hook:', updatesHookPath);
    console.log('Exists:', fs.existsSync(updatesHookPath));
    
    if (!fs.existsSync(subscriptionHookPath)) {
      console.log('❌ useRealtimeSubscription hook not found');
      return false;
    }
    
    if (!fs.existsSync(updatesHookPath)) {
      console.log('❌ useRealtimeUpdates hook not found');
      return false;
    }
    
    const hookContent = fs.readFileSync(subscriptionHookPath, 'utf8');
    const updatesContent = fs.readFileSync(updatesHookPath, 'utf8');
    
    console.log('Subscription hook content length:', hookContent.length);
    console.log('Updates hook content length:', updatesContent.length);
    
    // Check for required functionality
    const requiredFeatures = [
      'useRealtimeSubscription',
      'useRealtimeUpdates',
      '.channel',
      'postgres_changes',
      'queryClient.invalidateQueries'
    ];
    
    let allFeaturesExist = true;
    
    for (const feature of requiredFeatures) {
      const inSubscription = hookContent.includes(feature);
      const inUpdates = updatesContent.includes(feature);
      const exists = inSubscription || inUpdates;
      
      console.log(`Feature: ${feature}`);
      console.log(`  In subscription: ${inSubscription}`);
      console.log(`  In updates: ${inUpdates}`);
      console.log(`  Exists: ${exists}`);
      
      if (exists) {
        console.log(`✅ Feature exists: ${feature}`);
      } else {
        console.log(`❌ Feature missing: ${feature}`);
        allFeaturesExist = false;
      }
    }
    
    // Check if components use real-time updates
    const dashboardReviewsPath = path.join(__dirname, '..', 'src', 'pages', 'DashboardReviews.tsx');
    const dashboardReviewsContent = fs.readFileSync(dashboardReviewsPath, 'utf8');
    
    console.log('DashboardReviews uses useRealtimeUpdates:', dashboardReviewsContent.includes('useRealtimeUpdates'));
    
    if (dashboardReviewsContent.includes('useRealtimeUpdates')) {
      console.log('✅ DashboardReviews uses real-time updates');
    } else {
      console.log('❌ DashboardReviews missing real-time updates');
      allFeaturesExist = false;
    }
    
    return allFeaturesExist;
  } catch (error) {
    console.error('❌ Real-time updates test failed:', error.message);
    return false;
  }
}

testRealtimeUpdates()
  .then((success) => {
    console.log('\nResult:', success ? 'PASS' : 'FAIL');
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
