#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

// Parse command line arguments
const args = process.argv.slice(2);
const forceOverwrite = args.includes('--force') || args.includes('-f');
const showHelp = args.includes('--help') || args.includes('-h');

if (showHelp) {
  console.log(`
🚀 Talently Project Setup Script

Creates .env files for both API and root directories with interactive configuration.

Usage: node setup.js [options]

Options:
  -h, --help     Show this help message
  -f, --force    Force overwrite existing .env files

Files created:
  - apps/api/.env     (API configuration)
  - .env              (Root project configuration)

Examples:
  node setup.js                  # Interactive setup
  node setup.js --force          # Overwrite existing .env files
  npm run setup:env              # Run via npm script
  npm run setup                  # Full setup (env + dependencies)
`);
  process.exit(0);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateAppKey() {
  const key = crypto.randomBytes(32).toString('base64');
  return `base64:${key}`;
}

function promptUser(question, defaultValue = '') {
  return new Promise((resolve) => {
    const prompt = defaultValue
      ? `${question} (${defaultValue}): `
      : `${question}: `;

    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

async function createEnvFiles() {
  const apiEnvExamplePath = path.join(__dirname, '.env.example');
  const apiEnvPath = path.join(__dirname, '.env');
  const rootEnvPath = path.join(__dirname, '..', '..', '.env');

  try {
    // Check if API .env already exists
    const apiExists = fs.existsSync(apiEnvPath);
    const rootExists = fs.existsSync(rootEnvPath);

    if ((apiExists || rootExists) && !forceOverwrite) {
      if (apiExists) log('⚠️  API .env file already exists!', 'yellow');
      if (rootExists) log('⚠️  Root .env file already exists!', 'yellow');

      const overwrite = await promptUser('Do you want to overwrite existing files? (y/N)', 'N');

      if (overwrite.toLowerCase() !== 'y') {
        log('Setup cancelled.', 'yellow');
        log('💡 Use --force flag to overwrite automatically', 'blue');
        return false;
      }
    } else if ((apiExists || rootExists) && forceOverwrite) {
      log('🔄 Force overwriting existing .env files...', 'yellow');
    }

    // Check if .env.example exists
    if (!fs.existsSync(apiEnvExamplePath)) {
      log('❌ .env.example file not found in API directory!', 'red');
      return false;
    }

    // Read .env.example
    let apiEnvContent = fs.readFileSync(apiEnvExamplePath, 'utf8');

    log('\n🚀 Welcome to Talently Project Setup!', 'bold');
    log('═══════════════════════════════════════', 'blue');

    // Prompt for AI Gateway API Key
    log('\n📡 AI Configuration', 'blue');
    const aiApiKey = await promptUser('Enter your AI Gateway API Key (required)');

    if (!aiApiKey || aiApiKey === 'your-key') {
      log('❌ AI Gateway API Key is required!', 'red');
      return false;
    }

    // Generate APP_KEY
    log('\n🔑 Generating Application Key...', 'blue');
    const appKey = generateAppKey();

    // Prompt for optional database configuration
    log('\n🗄️  Database Configuration', 'blue');
    const dbName = await promptUser('Database name', 'talently');
    const dbUser = await promptUser('Database user', 'talently');
    const dbPassword = await promptUser('Database password', 'talently');
    const dbPort = await promptUser('Database port', '5433');

    // Prompt for app configuration
    log('\n⚙️  Application Configuration', 'blue');
    const appName = await promptUser('Application name', 'TalentlyAPI');
    const appUrl = await promptUser('Application URL', 'http://localhost');
    const appEnv = await promptUser('Environment (local/production)', 'local');

    // Replace values in API env content
    apiEnvContent = apiEnvContent
      .replace('APP_KEY=', `APP_KEY=${appKey}`)
      .replace('APP_NAME=TalentlyAPI', `APP_NAME=${appName}`)
      .replace('APP_ENV=local', `APP_ENV=${appEnv}`)
      .replace('APP_URL=http://localhost', `APP_URL=${appUrl}`)
      .replace('POSTGRES_DB=talently', `POSTGRES_DB=${dbName}`)
      .replace('POSTGRES_USER=talently', `POSTGRES_USER=${dbUser}`)
      .replace('POSTGRES_PASSWORD=talently', `POSTGRES_PASSWORD=${dbPassword}`)
      .replace('POSTGRES_PORT=5433', `POSTGRES_PORT=${dbPort}`)
      .replace('DB_DATABASE=talently', `DB_DATABASE=${dbName}`)
      .replace('DB_USERNAME=talently', `DB_USERNAME=${dbUser}`)
      .replace('DB_PASSWORD=talently', `DB_PASSWORD=${dbPassword}`)
      .replace('DB_PORT=5433', `DB_PORT=${dbPort}`)
      .replace('AI_GATEWAY_API_KEY=your-key', `AI_GATEWAY_API_KEY=${aiApiKey}`);

    // Create root .env content
    const rootEnvContent = `AI_GATEWAY_API_KEY=${aiApiKey}\n`;

    // Write API .env file
    fs.writeFileSync(apiEnvPath, apiEnvContent);
    log('✅ Created API .env file', 'green');

    // Write root .env file
    fs.writeFileSync(rootEnvPath, rootEnvContent);
    log('✅ Created root .env file', 'green');

    log('\n✅ Environment Setup Complete!', 'green');
    log('═══════════════════════════════════════', 'blue');
    log(`📁 Created: ${apiEnvPath}`, 'green');
    log(`📁 Created: ${rootEnvPath}`, 'green');
    log(`🔑 Generated APP_KEY: ${appKey.substring(0, 20)}...`, 'green');
    log(`🌐 App URL: ${appUrl}`, 'green');
    log(`🗄️  Database: ${dbName}@${dbPort}`, 'green');
    log(`📡 AI Gateway configured`, 'green');

    log('\n📋 Next Steps:', 'blue');
    log('1. Make sure PostgreSQL is running', 'yellow');
    log('2. Run: composer install', 'yellow');
    log('3. Run: php artisan migrate', 'yellow');
    log('4. Run: php artisan serve', 'yellow');

    return true;

  } catch (error) {
    log(`❌ Error creating .env files: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  try {
    const success = await createEnvFiles();
    rl.close();
    process.exit(success ? 0 : 1);
  } catch (error) {
    log(`❌ Setup failed: ${error.message}`, 'red');
    rl.close();
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
rl.on('SIGINT', () => {
  log('\n\n👋 Setup cancelled by user.', 'yellow');
  rl.close();
  process.exit(1);
});

main();
