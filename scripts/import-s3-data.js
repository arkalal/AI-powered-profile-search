// Load environment variables
import 'dotenv/config';

// Import the ETL process function
import processS3ToTypesense from '../lib/s3-to-typesense.js';

// Get bucket and file key from command line or use defaults
const bucket = process.argv[2] || process.env.S3_BUCKET || 'arka-candidate-data';
const key = process.argv[3] || process.env.S3_KEY || 'data_1.jsonl';

async function main() {
  console.log(`Starting import from S3 bucket "${bucket}" with file "${key}"`);
  console.log('This may take several minutes depending on file size...');
  
  try {
    const result = await processS3ToTypesense(bucket, key);
    
    if (result.success) {
      console.log(`✅ Import completed successfully!`);
      console.log(`   Processed: ${result.processed} records`);
      console.log(`   Errors: ${result.errors} records`);
      process.exit(0);
    } else {
      console.error(`❌ Import failed: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Import process error:', error);
    process.exit(1);
  }
}

// Execute the import
main();
