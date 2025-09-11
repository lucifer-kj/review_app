#!/usr/bin/env node

/**
 * Environment Setup Helper Script
 * This script helps you set up your environment variables for production deployment
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupEnvironment() {
  console.log('🔧 Environment Setup Helper\n');
  console.log('This script will help you set up your environment variables.\n');

  const envPath = path.join(__dirname, '../.env');
  
  // Check if .env exists
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found. Creating from template...');
    const examplePath = path.join(__dirname, '../env.example');
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, envPath);
      console.log('✅ .env file created from template');
    } else {
      console.log('❌ env.example not found. Please create .env manually.');
      process.exit(1);
    }
  }

  console.log('\n📋 Please provide your Supabase credentials:\n');

  try {
    const supabaseUrl = await question('Supabase URL (e.g., https://your-project.supabase.co): ');
    const supabaseAnonKey = await question('Supabase Anonymous Key: ');
    const supabaseServiceKey = await question('Supabase Service Role Key: ');
    const frontendUrl = await question('Frontend URL (e.g., https://demo.alphabusinessdesigns.co.in): ');

    // Read current .env content
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Update the values
    envContent = envContent.replace(
      /VITE_SUPABASE_URL=.*/,
      `VITE_SUPABASE_URL=${supabaseUrl}`
    );
    envContent = envContent.replace(
      /VITE_SUPABASE_ANON_KEY=.*/,
      `VITE_SUPABASE_ANON_KEY=${supabaseAnonKey}`
    );
    envContent = envContent.replace(
      /VITE_SUPABASE_SERVICE_ROLE_KEY=.*/,
      `VITE_SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}`
    );
    envContent = envContent.replace(
      /VITE_FRONTEND_URL=.*/,
      `VITE_FRONTEND_URL=${frontendUrl}`
    );

    // Write updated content
    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ Environment variables updated successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run: npm run deploy:prod');
    console.log('   2. Deploy your application to Vercel');
    console.log('   3. Test the review form URL');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

// Run setup
setupEnvironment();