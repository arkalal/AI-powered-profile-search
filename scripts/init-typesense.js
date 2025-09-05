// Load environment variables
import 'dotenv/config';

// Import Typesense client
import Typesense from 'typesense';

// Create a Typesense client
const typesense = new Typesense.Client({
  nodes: [{
    host: process.env.TYPESENSE_HOST || 'localhost',
    port: process.env.TYPESENSE_PORT || 8108,
    protocol: process.env.TYPESENSE_PROTOCOL || 'http',
  }],
  apiKey: process.env.TYPESENSE_API_KEY || 'xyz',
  connectionTimeoutSeconds: 10,
});

// Schema definition for the 'people' collection
const peopleSchema = {
  name: 'people',
  fields: [
    { name: 'id', type: 'string' },
    { name: 'first_name', type: 'string' },
    { name: 'last_name', type: 'string' },
    { name: 'name_full', type: 'string', sort: true },
    { name: 'title', type: 'string', optional: true },
    { name: 'summary', type: 'string', optional: true },
    { name: 'country', type: 'string', optional: true, facet: true },
    { name: 'city', type: 'string', optional: true, facet: true },
    { name: 'functional_area', type: 'string', optional: true, facet: true },
    { name: 'current_industry', type: 'string', optional: true, facet: true },
    { name: 'skills', type: 'string[]', optional: true, facet: true },
    { name: 'past_employers', type: 'string[]', optional: true, facet: true },
    { name: 'size_buckets', type: 'string[]', optional: true, facet: true },
    { name: 'education_signals', type: 'string[]', optional: true, facet: true },
    { name: 'seniority_guess', type: 'string', optional: true, facet: true },
    { name: 'linkedin_url', type: 'string', optional: true },
    { name: 'experience', type: 'string', optional: true },
    { name: 'education', type: 'string', optional: true },
  ],
  default_sorting_field: 'name_full',
  enable_nested_fields: true,
};

async function main() {
  console.log('Initializing Typesense collection...');
  console.log(`Using Typesense at: ${process.env.TYPESENSE_PROTOCOL}://${process.env.TYPESENSE_HOST}:${process.env.TYPESENSE_PORT}`);
  
  try {
    // Check if collection exists
    try {
      const existingCollection = await typesense.collections('people').retrieve();
      console.log('Collection already exists:', existingCollection.name);
      console.log('Recreating collection for fresh start...');
      
      // Delete the existing collection
      await typesense.collections('people').delete();
      console.log('Deleted existing people collection');
    } catch (error) {
      if (error.httpStatus === 404) {
        console.log('Collection does not exist yet, will create it');
      } else {
        throw error;
      }
    }

    // Create the collection with our schema
    const createdCollection = await typesense.collections().create(peopleSchema);
    console.log('✅ Created people collection:', createdCollection.name);
    return true;
  } catch (error) {
    console.error('❌ Error initializing Typesense:', error);
    return false;
  }
}

main()
  .then(success => {
    if (success) {
      console.log('✅ Typesense collection initialized successfully!');
      process.exit(0);
    } else {
      console.error('❌ Failed to initialize Typesense collection');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Initialization error:', err);
    process.exit(1);
  });
