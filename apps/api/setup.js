#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');
const { exec } = require('child_process');
const { promisify } = require('util');
const net = require('net');

const execAsync = promisify(exec);

// Parse command line arguments
const args = process.argv.slice(2);
const forceOverwrite = args.includes('--force') || args.includes('-f');
const showHelp = args.includes('--help') || args.includes('-h');

// Extract API key from --api-key flag
let providedApiKey = null;
const apiKeyIndex = args.findIndex(arg => arg.startsWith('--api-key'));
if (apiKeyIndex !== -1) {
  const apiKeyArg = args[apiKeyIndex];
  if (apiKeyArg.includes('=')) {
    providedApiKey = apiKeyArg.split('=')[1];
  } else if (args[apiKeyIndex + 1] && !args[apiKeyIndex + 1].startsWith('-')) {
    providedApiKey = args[apiKeyIndex + 1];
  }
}

if (showHelp) {
  console.log(`
🚀 Talently Project Setup Script

Interactive setup script with multiple deployment modes.

Usage: node setup.js [options]

Options:
  -h, --help           Show this help message
  -f, --force          Force overwrite existing .env files
  --api-key <key>      Provide AI Gateway API key directly (avoids prompt)

Setup Modes:
  1. Preview Mode
     - Creates .env files
     - Starts full Docker Compose stack
     - Ready for testing/demonstration

  2. Local Development
     - Creates .env files
     - Starts PostgreSQL with conflict resolution
     - Installs dependencies
     - Runs database migrations
     - Ready for development

  3. Environment Only
     - Creates .env files only
     - No database startup or dependencies
     - Manual next steps provided

Features:
  - Intelligent port conflict detection and resolution
  - Interactive configuration prompts
  - Environment-specific optimizations
  - Clear next-steps guidance

Files created:
  - apps/api/.env     (API configuration)
  - .env              (Root project configuration)

Examples:
  node setup.js                              # Interactive mode selection
  node setup.js --force                      # Overwrite existing files
  node setup.js --api-key=vg_abcd123...     # Provide API key directly
  npm run setup:env                          # Run via npm script
  npm run setup                              # Full development setup
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

function promptSetupMode() {
  return new Promise((resolve) => {
    log('\n🚀 Welcome to Talenty Project Setup!', 'bold');
    log('═══════════════════════════════════════', 'blue');
    log('\nChoose your setup mode:', 'blue');
    log('1. Preview mode (Docker Compose with full stack)', 'yellow');
    log('2. Local development (PostgreSQL + migrations)', 'yellow');
    log('3. Environment only (just create .env files)', 'yellow');

    rl.question(`\nSelect mode [1-3] (1): `, (answer) => {
      const choice = answer.trim() || '1';
      switch(choice) {
        case '1':
          resolve('preview');
          break;
        case '2':
          resolve('development');
          break;
        case '3':
          resolve('env-only');
          break;
        default:
          log('Invalid choice, defaulting to local development', 'yellow');
          resolve('development');
      }
    });
  });
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.listen(port, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });

    server.on('error', () => {
      resolve(false);
    });
  });
}

async function findAvailablePort(startPort = 5433) {
  let port = startPort;
  while (port < 65535) {
    if (await isPortAvailable(port)) {
      return port;
    }
    port++;
  }
  throw new Error('No available ports found');
}

function updateEnvFile(filePath, key, value) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const regex = new RegExp(`^${key}=.*$`, 'm');

  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content += `\n${key}=${value}`;
  }

  fs.writeFileSync(filePath, content);
  return true;
}

async function checkDockerRunning() {
  try {
    await execAsync('docker --version');
    return true;
  } catch (error) {
    return false;
  }
}

async function startPostgreSQL(dbPort = '5433') {
  log('\n🐳 Starting PostgreSQL Database...', 'blue');

  // Check if Docker is running
  if (!(await checkDockerRunning())) {
    log('❌ Docker is not running or not installed!', 'red');
    log('Please start Docker and try again.', 'yellow');
    return { success: false, port: dbPort };
  }

  // Check if the port is available
  const portNumber = parseInt(dbPort);
  const portAvailable = await isPortAvailable(portNumber);

  if (!portAvailable) {
    log(`⚠️  Port ${portNumber} is already in use!`, 'yellow');

    try {
      const newPort = await findAvailablePort(portNumber + 1);
      log(`🔍 Found available port: ${newPort}`, 'green');

      const useNewPort = await promptUser(`Use port ${newPort} instead? (Y/n)`, 'Y');
      if (useNewPort.toLowerCase() === 'n') {
        log('Setup cancelled due to port conflict.', 'yellow');
        return { success: false, port: dbPort };
      }

      // Update .env files with new port
      const apiEnvPath = path.join(__dirname, '.env');
      const rootEnvPath = path.join(__dirname, '..', '..', '.env');

      if (fs.existsSync(apiEnvPath)) {
        updateEnvFile(apiEnvPath, 'POSTGRES_PORT', newPort);
        updateEnvFile(apiEnvPath, 'DB_PORT', newPort);
        log(`✅ Updated API .env file with port ${newPort}`, 'green');
      }

      dbPort = newPort.toString();
      log(`📝 PostgreSQL will use port ${newPort}`, 'blue');

    } catch (error) {
      log(`❌ Could not find available port: ${error.message}`, 'red');
      return { success: false, port: dbPort };
    }
  }

  try {
    // Start PostgreSQL service
    log('Starting PostgreSQL container...', 'yellow');
    await execAsync('docker-compose up -d postgres');

    // Wait for PostgreSQL to be ready
    log('Waiting for PostgreSQL to be ready...', 'yellow');
    let retries = 0;
    const maxRetries = 10;

    while (retries < maxRetries) {
      try {
        // Use a simple connection test that works with the configured credentials
        await execAsync('docker-compose exec -T postgres sh -c \'pg_isready -h localhost\'');
        log('✅ PostgreSQL is ready!', 'green');
        return { success: true, port: dbPort };
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          log('❌ PostgreSQL failed to start after 30 seconds', 'red');
          log('You can check status with: docker-compose ps', 'blue');
          return { success: false, port: dbPort };
        }
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  } catch (error) {
    // Check if it's a port binding error
    if (error.message.includes('port is already allocated') || error.message.includes('bind')) {
      log(`❌ Port ${dbPort} conflict detected!`, 'red');
      log('The port may have been allocated after our check.', 'yellow');
      log('Please try running the setup again or manually stop conflicting services.', 'blue');
    } else {
      log(`❌ Error starting PostgreSQL: ${error.message}`, 'red');
    }
    log('You can start PostgreSQL manually with: docker-compose up -d postgres', 'blue');
    return { success: false, port: dbPort };
  }
}

async function stopOnExit() {
  log('\n🛑 Stopping services on exit...', 'yellow');
  try {
    await execAsync('docker-compose down');
    log('✅ Services stopped', 'green');
  } catch (error) {
    // Ignore errors during cleanup
  }
}

async function createEnvFiles(mode = 'env-only') {
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
        return { success: false, dbPort: null };
      }
    } else if ((apiExists || rootExists) && forceOverwrite) {
      log('🔄 Force overwriting existing .env files...', 'yellow');
    }

    // Check if .env.example exists
    if (!fs.existsSync(apiEnvExamplePath)) {
      log('❌ .env.example file not found in API directory!', 'red');
      return { success: false, dbPort: null };
    }

    // Read .env.example
    let apiEnvContent = fs.readFileSync(apiEnvExamplePath, 'utf8');

    log('\n📡 AI Configuration', 'blue');
    let aiApiKey;
    
    if (providedApiKey) {
      aiApiKey = providedApiKey;
      log(`✅ Using provided AI Gateway API Key`, 'green');
    } else {
      aiApiKey = await promptUser('Enter your AI Gateway API Key (required)');
      
      if (!aiApiKey || aiApiKey === 'your-key') {
        log('❌ AI Gateway API Key is required!', 'red');
        log('💡 Tip: You can provide it directly with --api-key flag', 'blue');
        return { success: false, dbPort: null };
      }
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

    return { success: true, dbPort: dbPort, config: { dbName, dbUser, dbPassword, appUrl } };

  } catch (error) {
    log(`❌ Error creating .env files: ${error.message}`, 'red');
    return { success: false, dbPort: null };
  }
}

async function main() {
  try {
    // Get setup mode choice
    const mode = await promptSetupMode();

    const envResult = await createEnvFiles(mode);
    if (!envResult.success) {
      rl.close();
      process.exit(1);
    }

    const { dbPort, config } = envResult;

    // Execute mode-specific actions
    switch (mode) {
      case 'preview':
        await runPreviewMode();
        break;
      case 'development':
        await runDevelopmentMode(dbPort);
        break;
      case 'env-only':
        await runEnvOnlyMode();
        break;
    }

    rl.close();
    process.exit(0);
  } catch (error) {
    log(`❌ Setup failed: ${error.message}`, 'red');
    rl.close();
    process.exit(1);
  }
}

async function runPreviewMode() {
  log('\n🐳 Preview Mode Setup', 'blue');
  log('═════════════════════', 'blue');

  // Check preview ports availability
  const webPort = await findAvailablePreviewPort(3000);
  const apiPort = await findAvailablePreviewPort(8080);

  let portMessage = '';
  if (webPort !== 3000 || apiPort !== 8080) {
    portMessage = '\n🔄 Port conflicts detected - using alternative ports';
    log(portMessage, 'yellow');
  }

  try {
    log('Starting full preview environment...', 'yellow');

    // Set environment variables for alternative ports and start containers
    const envOverride = `WEB_PORT=${webPort} API_PORT=${apiPort}`;
    await execAsync(`cd ../.. && ${envOverride} docker compose -f docker-compose.preview.yml up --build -d`);

    // Wait a moment for services to be ready
    log('Waiting for services to initialize...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 3000));

    log('\n🎉 Preview Environment Ready!', 'green');
    log('═══════════════════════════════', 'green');

    log('\n🧪 Now you can test:', 'bold');

    log('\n👤 Test Credentials:', 'blue');
    log('• Email: test@example.local', 'green');
    log('• Password: admin', 'green');

    log('\n🌐 Environment URLs:', 'blue');
    log(`• Dashboard is running at: http://localhost:${webPort}`, 'green');
    log(`• API is running at: http://localhost:${apiPort}/v1`, 'green');

    log('\n🛠️  Management Commands:', 'blue');
    log('• Stop preview: npm run preview:down', 'yellow');
    log('• View logs: npm run preview:logs', 'yellow');
    log('• Restart: npm run preview', 'yellow');

    if (webPort !== 3000 || apiPort !== 8080) {
      log('\n💡 Note: Using alternative ports due to conflicts', 'yellow');
    }
    log('\n💡 Tip: Services may take 30-60 seconds to be fully ready', 'yellow');

  } catch (error) {
    log(`❌ Error starting preview: ${error.message}`, 'red');
    log('You can start preview manually with: npm run preview', 'blue');
  }
}

async function findAvailablePreviewPort(startPort) {
  const isAvailable = await isPortAvailable(startPort);
  if (isAvailable) {
    return startPort;
  }

  log(`⚠️  Port ${startPort} is already in use, finding alternative...`, 'yellow');

  // Find next available port
  let port = startPort + 1;
  while (port < 65535) {
    if (await isPortAvailable(port)) {
      log(`🔍 Found available port: ${port}`, 'green');
      return port;
    }
    port++;
  }

  throw new Error(`No available ports found starting from ${startPort}`);
}

async function runDevelopmentMode(dbPort) {
  log('\n⚡ Development Mode Setup', 'blue');
  log('═══════════════════════', 'blue');

  // Start PostgreSQL
  const postgresResult = await startPostgreSQL(dbPort);
  const finalDbPort = postgresResult.port;

  if (!postgresResult.success) {
    log('⚠️  PostgreSQL failed to start', 'yellow');
    log('You can start PostgreSQL manually with: npm run db:start', 'blue');
    return;
  }

  try {
    log('\nInstalling dependencies...', 'yellow');
    await execAsync('composer install');

    log('Running database migrations...', 'yellow');
    await execAsync('php artisan migrate');

    log('Creating default test user...', 'yellow');
    await execAsync('php artisan app:create-default-user');

    log('\n🎉 Development Environment Ready!', 'green');
    log('═══════════════════════════════════', 'green');

    log('\n🧪 Now you can test:', 'bold');

    log('\n👤 Test Credentials:', 'blue');
    log('• Email: test@example.local', 'green');
    log('• Password: admin', 'green');

    log('\n🌐 Environment URLs:', 'blue');
    log('• API will run at: http://localhost:8000/v1', 'green');
    log(`• Database: PostgreSQL @ localhost:${finalDbPort}`, 'green');

    log('\n🚀 Ready to start developing:', 'blue');
    log('• Start API: php artisan serve', 'yellow');
    log('• Start queue worker: php artisan queue:work', 'yellow');
    log('• Run tests: php artisan test', 'yellow');

    log('\n🛠️  Database Management:', 'blue');
    log('• Stop database: npm run db:stop', 'yellow');
    log('• View database logs: npm run db:logs', 'yellow');
    log('• Reset database: php artisan migrate:fresh --seed', 'yellow');

  } catch (error) {
    log(`⚠️  Error during development setup: ${error.message}`, 'yellow');
    log('\n📋 Manual steps needed:', 'blue');
    log('• Run: composer install', 'yellow');
    log('• Run: php artisan migrate', 'yellow');
    log('• Run: php artisan app:create-default-user', 'yellow');
    log('• Run: php artisan serve', 'yellow');
  }
}

async function runEnvOnlyMode() {
  log('\n📝 Environment Only Mode', 'blue');
  log('═══════════════════════', 'blue');

  log('\n✅ Environment files created successfully!', 'green');

  log('\n📋 Next Steps:', 'blue');
  log('• Install dependencies: composer install', 'yellow');
  log('• Start database: npm run db:start', 'yellow');
  log('• Run migrations: php artisan migrate', 'yellow');
  log('• Create test user: php artisan app:create-default-user', 'yellow');
  log('• Start API: php artisan serve', 'yellow');

  log('\n👤 Test Credentials (after creating user):', 'blue');
  log('• Email: test@example.local', 'green');
  log('• Password: admin', 'green');

  log('\n🌐 URLs (after starting services):', 'blue');
  log('• API will run at: http://localhost:8000/v1', 'green');

  log('\n🚀 Quick setup shortcut:', 'blue');
  log('Run: npm run setup (and choose development mode)', 'yellow');
}

// Handle Ctrl+C gracefully
rl.on('SIGINT', () => {
  log('\n\n👋 Setup cancelled by user.', 'yellow');
  rl.close();
  process.exit(1);
});

main();
