/**
 * Database Clear Script
 * @description Safely clears all users and votes from the database
 * @version 2.0.0
 * @author Production Auth System
 * 
 * @usage
 * node scripts/clearDatabase.js          # Production mode (requires confirmation)
 * node scripts/clearDatabase.js --force  # Force mode (no confirmation, for testing)
 * node scripts/clearDatabase.js --help   # Show help
 */

require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');

// =============================================================================
// CONFIGURATION
// =============================================================================

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/voting_system';

// Collections to clear
const COLLECTIONS = {
  users: 'users',
  votes: 'votes',
  candidates: 'candidates',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create colored console output
 */
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
};

/**
 * Log with timestamp
 */
const log = {
  info: (msg) => console.log(`${colors.blue('[INFO]')} ${msg}`),
  success: (msg) => console.log(`${colors.green('[SUCCESS]')} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow('[WARN]')} ${msg}`),
  error: (msg) => console.log(`${colors.red('[ERROR]')} ${msg}`),
};

/**
 * Ask for user confirmation
 * @param {string} question - Question to ask
 * @returns {Promise<boolean>} - User's response
 */
const askConfirmation = (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${colors.yellow(question)} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
};

/**
 * Show script usage
 */
const showHelp = () => {
  console.log(`
${colors.bold('Database Clear Script')} - Safely clears all users and votes

${colors.cyan('Usage:')}
  node scripts/clearDatabase.js [options]

${colors.cyan('Options:')}
  --force     Skip confirmation prompt (use in testing/CI)
  --users     Clear only users collection
  --votes     Clear only votes collection
  --all       Clear all collections (default)
  --help      Show this help message

${colors.cyan('Examples:')}
  node scripts/clearDatabase.js              # Interactive mode
  node scripts/clearDatabase.js --force      # Force clear everything
  node scripts/clearDatabase.js --users      # Clear only users
  node scripts/clearDatabase.js --force --votes  # Force clear only votes

${colors.yellow('⚠️  Warning:')} This action is ${colors.red('IRREVERSIBLE')}. Make sure you have backups!
`);
};

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

/**
 * Connect to MongoDB
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  log.info(`Connecting to MongoDB...`);
  
  await mongoose.connect(MONGO_URI);
  
  log.success(`Connected to MongoDB: ${mongoose.connection.name}`);
};

/**
 * Clear a specific collection
 * @param {string} collectionName - Name of the collection to clear
 * @returns {Promise<number>} - Number of documents deleted
 */
const clearCollection = async (collectionName) => {
  try {
    const collection = mongoose.connection.collection(collectionName);
    const countBefore = await collection.countDocuments();
    
    if (countBefore === 0) {
      log.info(`Collection '${collectionName}' is already empty`);
      return 0;
    }
    
    const result = await collection.deleteMany({});
    log.success(`Cleared ${result.deletedCount} documents from '${collectionName}'`);
    return result.deletedCount;
  } catch (error) {
    // Collection might not exist
    if (error.code === 26) {
      log.info(`Collection '${collectionName}' does not exist`);
      return 0;
    }
    throw error;
  }
};

/**
 * Clear all collections
 * @param {Object} options - Clear options
 * @returns {Promise<Object>} - Summary of deleted documents
 */
const clearDatabase = async (options = {}) => {
  const { users: clearUsers = true, votes: clearVotes = true, candidates: clearCandidates = true } = options;
  
  const summary = {};
  
  if (clearUsers) {
    summary.users = await clearCollection(COLLECTIONS.users);
  }
  
  if (clearVotes) {
    summary.votes = await clearCollection(COLLECTIONS.votes);
  }
  
  if (clearCandidates) {
    summary.candidates = await clearCollection(COLLECTIONS.candidates);
  }
  
  return summary;
};

/**
 * Get current database statistics
 * @returns {Promise<Object>} - Collection counts
 */
const getStats = async () => {
  const stats = {};
  
  for (const [key, name] of Object.entries(COLLECTIONS)) {
    try {
      const collection = mongoose.connection.collection(name);
      stats[key] = await collection.countDocuments();
    } catch (error) {
      stats[key] = 0;
    }
  }
  
  return stats;
};

// =============================================================================
// MAIN EXECUTION
// =============================================================================

const main = async () => {
  const args = process.argv.slice(2);
  
  // Show help
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }
  
  const forceMode = args.includes('--force') || args.includes('-f');
  const clearUsersOnly = args.includes('--users');
  const clearVotesOnly = args.includes('--votes');
  const clearCandidatesOnly = args.includes('--candidates');
  
  // Determine what to clear
  let clearOptions = {};
  if (clearUsersOnly || clearVotesOnly || clearCandidatesOnly) {
    clearOptions = {
      users: clearUsersOnly,
      votes: clearVotesOnly,
      candidates: clearCandidatesOnly,
    };
  } else {
    clearOptions = { users: true, votes: true, candidates: true };
  }
  
  console.log('\n' + colors.bold('═══════════════════════════════════════════════════════════'));
  console.log(colors.bold('                  DATABASE CLEAR SCRIPT                      '));
  console.log(colors.bold('═══════════════════════════════════════════════════════════') + '\n');
  
  try {
    // Connect to database
    await connectDB();
    
    // Show current stats
    const statsBefore = await getStats();
    console.log('\n' + colors.cyan('Current Database Status:'));
    console.log(`  Users:      ${statsBefore.users}`);
    console.log(`  Votes:      ${statsBefore.votes}`);
    console.log(`  Candidates: ${statsBefore.candidates}\n`);
    
    // Show what will be cleared
    console.log(colors.cyan('Will Clear:'));
    if (clearOptions.users) console.log(`  ${colors.red('✗')} Users collection`);
    if (clearOptions.votes) console.log(`  ${colors.red('✗')} Votes collection`);
    if (clearOptions.candidates) console.log(`  ${colors.red('✗')} Candidates collection`);
    console.log();
    
    // Ask for confirmation unless in force mode
    if (!forceMode) {
      console.log(colors.yellow('⚠️  WARNING: This action is IRREVERSIBLE!'));
      console.log(colors.yellow('   All data in the selected collections will be permanently deleted.\n'));
      
      const confirmed = await askConfirmation('Are you sure you want to proceed?');
      
      if (!confirmed) {
        log.info('Operation cancelled by user');
        await mongoose.disconnect();
        process.exit(0);
      }
      
      console.log();
    } else {
      log.warn('Force mode enabled - skipping confirmation');
    }
    
    // Clear database
    log.info('Starting database clear...\n');
    const summary = await clearDatabase(clearOptions);
    
    // Show summary
    console.log('\n' + colors.cyan('Clear Summary:'));
    let totalDeleted = 0;
    for (const [collection, count] of Object.entries(summary)) {
      console.log(`  ${collection}: ${count} documents deleted`);
      totalDeleted += count;
    }
    console.log(`\n  ${colors.bold('Total:')} ${totalDeleted} documents deleted`);
    
    // Verify
    const statsAfter = await getStats();
    console.log('\n' + colors.cyan('Database Status After Clear:'));
    console.log(`  Users:      ${statsAfter.users}`);
    console.log(`  Votes:      ${statsAfter.votes}`);
    console.log(`  Candidates: ${statsAfter.candidates}\n`);
    
    log.success('Database clear completed successfully!\n');
    
    // Disconnect
    await mongoose.disconnect();
    log.info('Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    log.error(`Failed to clear database: ${error.message}`);
    console.error(error);
    
    // Attempt to disconnect
    try {
      await mongoose.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    
    process.exit(1);
  }
};

// Run main function
main();
