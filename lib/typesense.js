import Typesense from 'typesense';

// Create a Typesense client
const typesense = new Typesense.Client({
  nodes: [{
    host: process.env.TYPESENSE_HOST || 'pftawq0bix37yg1mp-1.a1.typesense.net',
    port: process.env.TYPESENSE_PORT || 443,
    protocol: process.env.TYPESENSE_PROTOCOL || 'https',
  }],
  apiKey: process.env.TYPESENSE_API_KEY || 'i6vLeN3S9KV3DhnxvtkMPwvTsPaZ9Q1k',
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

// Initialize Typesense collection
export const initializeTypesense = async () => {
  try {
    // Try to delete the collection if it exists
    try {
      await typesense.collections('people').delete();
      console.log('Deleted existing people collection');
    } catch (error) {
      // Collection doesn't exist, which is fine
    }

    // Create the collection with our schema
    await typesense.collections().create(peopleSchema);
    console.log('Created people collection');
    return true;
  } catch (error) {
    console.error('Error initializing Typesense:', error);
    return false;
  }
};

export default typesense;
