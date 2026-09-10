#!/usr/bin/env node

/**
 * System Settings Management CLI
 * 
 * A backdoor CLI tool to manage system settings, including enabling/disabling
 * basic authentication when locked out of the system.
 * 
 * Usage:
 *   node scripts/manage-system-settings.js list
 *   node scripts/manage-system-settings.js get <key>
 *   node scripts/manage-system-settings.js set <key> <value>
 *   node scripts/manage-system-settings.js enable-basic-auth
 *   node scripts/manage-system-settings.js disable-basic-auth
 * 
 * Examples:
 *   node scripts/manage-system-settings.js set basicAuthEnabled true
 *   node scripts/manage-system-settings.js enable-basic-auth
 *   node scripts/manage-system-settings.js disable-basic-auth
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config(); // Also try root .env

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// Get database connection string
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL or POSTGRES_URL environment variable is not set');
  console.error('   Please set it in .env.local or .env file');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Helper function to prompt for password (hidden input)
function promptPassword(rl, prompt) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    
    // Check if stdin is a TTY (terminal)
    if (!stdin.isTTY) {
      // Not a TTY, read normally (for pipes/redirects)
      rl.question(prompt, (answer) => {
        resolve(answer);
      });
      return;
    }
    
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    
    let password = '';
    
    const onData = (char) => {
      char = char.toString();
      
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl+D
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          stdout.write('\n');
          resolve(password);
          break;
        case '\u0003': // Ctrl+C
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          process.exit(1);
          break;
        case '\u007f': // Backspace (Unix)
        case '\b': // Backspace (Windows)
          if (password.length > 0) {
            password = password.slice(0, -1);
            stdout.write('\b \b');
          }
          break;
        default:
          // Only add printable characters
          if (char >= ' ') {
            password += char;
            stdout.write('*');
          }
          break;
      }
    };
    
    stdin.on('data', onData);
  });
}

// Helper function to prompt for input
function promptInput(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Authenticate admin user
async function authenticateAdmin(email, password) {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.password, u.role, u."is_active", ug.permissions
       FROM "User" u
       LEFT JOIN "UserGroup" ug ON u."userGroupId" = ug.id
       WHERE u.email = $1`,
      [email]
    );
    
    if (result.rows.length === 0) {
      return { success: false, error: 'User not found' };
    }
    
    const user = result.rows[0];
    
    // Check if user has password (basic auth user)
    if (!user.password) {
      return { success: false, error: 'User does not have password authentication enabled' };
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return { success: false, error: 'Invalid password' };
    }
    
    // Check if user is active
    if (!user.is_active) {
      return { success: false, error: 'User account is disabled' };
    }
    
    // Check if user is Admin role or has admin permissions
    const isAdmin = user.role === 'Admin' || 
                    (user.permissions && Array.isArray(user.permissions) && 
                     (user.permissions.includes('SYSTEM_SETTINGS_EDIT') || 
                      user.permissions.includes('SYSTEM_SETTINGS_VIEW')));
    
    if (!isAdmin) {
      return { success: false, error: 'User does not have admin privileges' };
    }
    
    return { success: true, user: { id: user.id, email: user.email, role: user.role } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Prompt for admin credentials
async function promptForCredentials() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  try {
    const email = await promptInput(rl, 'Admin Email: ');
    if (!email) {
      rl.close();
      return null;
    }
    
    const password = await promptPassword(rl, 'Password: ');
    rl.close();
    
    return { email, password };
  } catch (error) {
    rl.close();
    throw error;
  }
}

// Helper function to format output
function formatOutput(data, format = 'table') {
  if (format === 'json') {
    console.log(JSON.stringify(data, null, 2));
  } else {
    if (Array.isArray(data)) {
      if (data.length === 0) {
        console.log('No settings found.');
        return;
      }
      console.log('\n📋 System Settings:');
      console.log('─'.repeat(80));
      console.log(`${'Key'.padEnd(40)} | Value`);
      console.log('─'.repeat(80));
      data.forEach(setting => {
        const value = setting.value || '(empty)';
        const truncatedValue = value.length > 35 ? value.substring(0, 32) + '...' : value;
        console.log(`${setting.key.padEnd(40)} | ${truncatedValue}`);
      });
      console.log('─'.repeat(80));
      console.log(`Total: ${data.length} settings\n`);
    } else {
      console.log(`\n📋 Setting: ${data.key}`);
      console.log(`   Value: ${data.value || '(empty)'}`);
      console.log(`   Created: ${data.created_at || 'N/A'}`);
      console.log(`   Updated: ${data.updated_at || 'N/A'}\n`);
    }
  }
}

// List all system settings
async function listSettings(format = 'table') {
  try {
    const result = await pool.query(
      'SELECT key, value, "createdAt", "updatedAt" FROM "SystemSetting" ORDER BY key'
    );
    // Map to consistent format
    const formatted = result.rows.map(row => ({
      key: row.key,
      value: row.value,
      created_at: row.createdAt,
      updated_at: row.updatedAt
    }));
    formatOutput(formatted, format);
  } catch (error) {
    console.error('Error listing settings:', error.message);
    throw error;
  }
}

// Get a specific setting
async function getSetting(key, format = 'table') {
  try {
    const result = await pool.query(
      'SELECT key, value, "createdAt", "updatedAt" FROM "SystemSetting" WHERE key = $1',
      [key]
    );
    
    if (result.rows.length === 0) {
      console.log(`Setting "${key}" not found.\n`);
      return null;
    }
    
    const row = result.rows[0];
    const formatted = {
      key: row.key,
      value: row.value,
      created_at: row.createdAt,
      updated_at: row.updatedAt
    };
    formatOutput(formatted, format);
    return formatted;
  } catch (error) {
    console.error(`Error getting setting "${key}":`, error.message);
    throw error;
  }
}

// Set a system setting
async function setSetting(key, value) {
  try {
    // Use UPSERT to handle both insert and update
    const result = await pool.query(
      `INSERT INTO "SystemSetting" (key, value, "createdAt", "updatedAt")
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (key) DO UPDATE SET
         value = EXCLUDED.value,
         "updatedAt" = NOW()
       RETURNING key, value, "createdAt", "updatedAt"`,
      [key, value]
    );
    
    if (result.rows.length > 0) {
      const existing = await pool.query(
        'SELECT key FROM "SystemSetting" WHERE key = $1 AND "createdAt" = "updatedAt"',
        [key]
      );
      
      if (existing.rows.length > 0) {
        console.log(`Created setting "${key}" = "${value}"\n`);
      } else {
        console.log(`Updated setting "${key}" = "${value}"\n`);
      }
    }
    
    // Show the updated setting
    await getSetting(key);
  } catch (error) {
    console.error(`Error setting "${key}":`, error.message);
    throw error;
  }
}

// Enable basic auth
async function enableBasicAuth() {
  console.log('Enabling basic username/password authentication...\n');
  await setSetting('basicAuthEnabled', 'true');
  console.log('Basic authentication is now ENABLED');
  console.log('   Users can now sign in with username and password.\n');
}

// Disable basic auth
async function disableBasicAuth() {
  console.log('Disabling basic username/password authentication...\n');
  await setSetting('basicAuthEnabled', 'false');
  console.log('Basic authentication is now DISABLED');
  console.log('   Users can only sign in via Azure AD or other OAuth providers.\n');
}

// Main CLI handler
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  // Check for --no-auth flag (emergency bypass)
  const noAuth = args.includes('--no-auth');
  const skipAuth = noAuth || process.env.CLI_NO_AUTH === 'true';
  
  if (!command) {
    console.log(`
🔧 System Settings Management CLI

Usage:
  node scripts/manage-system-settings.js <command> [options]

Commands:
  list                          List all system settings
  get <key>                     Get a specific setting by key
  set <key> <value>             Set a system setting
  enable-basic-auth             Enable basic username/password login
  disable-basic-auth            Disable basic username/password login

Examples:
  node scripts/manage-system-settings.js list
  node scripts/manage-system-settings.js get basicAuthEnabled
  node scripts/manage-system-settings.js set basicAuthEnabled true
  node scripts/manage-system-settings.js enable-basic-auth
  node scripts/manage-system-settings.js disable-basic-auth

Options:
  --json                        Output in JSON format (for list/get commands)
  --no-auth                     Skip authentication (emergency access only)
  --email <email>               Admin email (for non-interactive use)
  --password <password>         Admin password (for non-interactive use)

Security:
  By default, this CLI requires admin authentication. Use --no-auth only in
  emergency situations when you cannot authenticate through normal means.
    `);
    process.exit(0);
  }
  
  // Authenticate unless --no-auth is specified
  if (!skipAuth) {
    let email, password;
    
    // Check for credentials in command line args
    const emailIndex = args.indexOf('--email');
    const passwordIndex = args.indexOf('--password');
    
    if (emailIndex !== -1 && passwordIndex !== -1) {
      email = args[emailIndex + 1];
      password = args[passwordIndex + 1];
    } else {
      // Prompt for credentials
      console.log('Admin Authentication Required\n');
      const credentials = await promptForCredentials();
      if (!credentials) {
        console.error('Authentication cancelled');
        process.exit(1);
      }
      email = credentials.email;
      password = credentials.password;
    }
    
    if (!email || !password) {
      console.error('Error: Email and password are required');
      process.exit(1);
    }
    
    console.log('Verifying admin credentials...\n');
    const authResult = await authenticateAdmin(email, password);
    
    if (!authResult.success) {
      console.error(`Authentication failed: ${authResult.error}`);
      console.error('   Please check your email and password, and ensure you have admin privileges.');
      process.exit(1);
    }
    
    console.log(`Authenticated as: ${authResult.user.email} (${authResult.user.role})\n`);
  } else {
    console.warn('WARNING: Authentication bypassed (--no-auth flag used)');
    console.warn('   This should only be used in emergency situations.\n');
  }
  
  const format = args.includes('--json') ? 'json' : 'table';
  
  try {
    switch (command) {
      case 'list':
        await listSettings(format);
        break;
        
      case 'get':
        if (!args[1]) {
          console.error('Error: Please provide a setting key');
          console.error('   Example: node scripts/manage-system-settings.js get basicAuthEnabled');
          process.exit(1);
        }
        await getSetting(args[1], format);
        break;
        
      case 'set':
        if (!args[1] || args[2] === undefined) {
          console.error('Error: Please provide both key and value');
          console.error('   Example: node scripts/manage-system-settings.js set basicAuthEnabled true');
          process.exit(1);
        }
        await setSetting(args[1], args[2]);
        break;
        
      case 'enable-basic-auth':
        await enableBasicAuth();
        break;
        
      case 'disable-basic-auth':
        await disableBasicAuth();
        break;
        
      default:
        console.error(`Unknown command: ${command}`);
        console.error('   Run without arguments to see usage information');
        process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Operation failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the CLI
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

