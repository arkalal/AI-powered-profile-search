import fs from 'fs';
import readline from 'readline';
import typesense from '../lib/typesense.js';
import 'dotenv/config';

// Helper functions for data transformation
// Helper to convert "NA" string values to null
const handleNAValues = (value) => {
  if (value === "NA" || value === ["NA"]) {
    return null;
  }
  return value;
};

// Normalize skills from expertise field
const normalizeSkills = (expertise) => {
  if (!expertise || expertise === "NA") return [];
  return expertise.split(',')
    .map(skill => skill.trim().toLowerCase())
    .filter(Boolean)
    .filter((value, index, self) => self.indexOf(value) === index); // Deduplicate
};

// Extract company names from experiences
const normalizePastEmployers = (experiences) => {
  if (!experiences || experiences === "NA" || experiences === ["NA"]) return [];
  if (!Array.isArray(experiences)) return [];
  
  return experiences
    .map(exp => {
      if (!exp) return null;
      if (exp === "NA") return null;
      
      // Handle if exp is an object with name property
      if (typeof exp === 'object' && exp.name) {
        return exp.name.trim().replace(/\s+/g, ' ');
      }
      
      // If exp is just a string, return it
      if (typeof exp === 'string' && exp !== "NA") {
        return exp.trim().replace(/\s+/g, ' ');
      }
      
      return null;
    })
    .filter(Boolean)
    .filter((value, index, self) => self.indexOf(value) === index); // Deduplicate
};

// Calculate company size buckets
const getSizeBuckets = (experiences) => {
  if (!experiences || experiences === "NA" || experiences === ["NA"]) return [];
  if (!Array.isArray(experiences)) return [];
  
  const sizeBuckets = new Set();
  
  experiences.forEach(exp => {
    if (!exp || exp === "NA") return;
    if (!exp.estimated_num_employees || exp.estimated_num_employees === null) return;
    if (exp.estimated_num_employees === "NA") return;
    
    const size = exp.estimated_num_employees;
    
    if (size >= 0 && size <= 9) sizeBuckets.add('0-9');
    else if (size >= 10 && size <= 49) sizeBuckets.add('10-49');
    else if (size >= 50 && size <= 199) sizeBuckets.add('50-199');
    else if (size >= 200 && size <= 499) sizeBuckets.add('200-499');
    else if (size >= 500 && size <= 999) sizeBuckets.add('500-999');
    else if (size >= 1000 && size <= 4999) sizeBuckets.add('1000-4999');
    else if (size >= 5000) sizeBuckets.add('5000+');
  });
  
  return Array.from(sizeBuckets);
};

// Extract education signals like MBA, IIT, etc.
const getEducationSignals = (education) => {
  if (!education || education === "NA" || education === ["NA"]) return [];
  if (!Array.isArray(education)) return [];
  
  const signals = new Set();
  
  education.forEach(edu => {
    if (!edu || edu === "NA") return;
    
    // Convert education fields to lowercase for case-insensitive matching
    const fields = [];
    
    // Handle different education data structures
    if (typeof edu === 'object') {
      if (edu.campus && edu.campus !== "NA") fields.push(edu.campus.toLowerCase());
      if (edu.major && edu.major !== "NA") fields.push(edu.major.toLowerCase());
      if (edu.specialization && edu.specialization !== "NA") fields.push(edu.specialization.toLowerCase());
      if (edu.degree && edu.degree !== "NA") fields.push(edu.degree.toLowerCase());
    } else if (typeof edu === 'string' && edu !== "NA") {
      fields.push(edu.toLowerCase());
    }
    
    if (fields.length === 0) return;
    
    const allText = fields.join(' ');
    
    // Check for MBA
    if (allText.includes('mba') || 
        allText.includes('master of business administration')) {
      signals.add('mba');
    }
    
    // Check for IIT
    if (allText.includes('iit') || 
        allText.includes('indian institute of technology')) {
      signals.add('iit');
    }
    
    // Check for Computer Science
    if (allText.includes('computer science') || 
        allText.includes('software engineering') ||
        allText.includes('information technology')) {
      signals.add('computer-science');
    }
  });
  
  return Array.from(signals);
};

// Infer seniority from title and summary
const inferSeniority = (title, summary) => {
  // Handle NA values
  if ((title === "NA" || !title) && (summary === "NA" || !summary)) {
    return null;
  }
  
  // Filter out NA values and null values
  const validInputs = [title, summary].filter(item => item && item !== "NA");
  if (validInputs.length === 0) return null;
  
  const text = validInputs.join(' ').toLowerCase();
  
  if (text.match(/\b(ceo|cto|coo|cfo|founder|co-founder|owner)\b/)) {
    return 'cxo/founder';
  } else if (text.match(/\b(vp|vice president)\b/)) {
    return 'vp';
  } else if (text.match(/\b(director)\b/)) {
    return 'director';
  } else if (text.match(/\b(lead|manager|head|chief)\b/)) {
    return 'lead/manager';
  } else if (text.match(/\b(senior|sr\.)\b/)) {
    return 'senior';
  } else if (text.match(/\b(mid|intermediate)\b/)) {
    return 'mid';
  } else if (text.match(/\b(junior|jr\.)\b/)) {
    return 'junior';
  }
  
  return null;
};

// Main function to process local file data to Typesense
async function processLocalFileToTypesense(filePath) {
  try {
    console.log(`Processing local file: ${filePath}`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // Create readable stream from file
    const fileStream = fs.createReadStream(filePath);
    
    // Create readline interface for line-by-line processing
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });
    
    let lineCount = 0;
    let successCount = 0;
    let errorCount = 0;
    let batchDocuments = [];
    // Use a very small batch size for initial testing
    const BATCH_SIZE = 5;
    
    // Process each line (JSONL format)
    for await (const line of rl) {
      lineCount++;
      
      try {
        // Skip empty lines
        if (!line.trim()) continue;
        
        // Parse JSON object
        const doc = JSON.parse(line);
        
        // Skip records without required fields
        if (!doc.first_name || !doc.last_name) {
          console.warn(`Line ${lineCount}: Skipping record with missing required fields`);
          continue;
        }
        
        // Process and clean data - convert NA to null
        const cleanedDoc = {};
        for (const key in doc) {
          if (doc[key] === "NA" || doc[key] === ["NA"]) {
            cleanedDoc[key] = null;
          } else {
            cleanedDoc[key] = doc[key];
          }
        }
        
        // Handle required fields that must not be null
        const first_name = cleanedDoc.first_name || 'unknown';
        const last_name = cleanedDoc.last_name || 'unknown';
        const linkedin_url = cleanedDoc.linkedin_url === "NA" ? null : cleanedDoc.linkedin_url;
        
        // Generate stable ID
        const id = cleanedDoc.id || 
          `${first_name}-${last_name}-${linkedin_url || lineCount}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        
        // Transform data
        const transformedDoc = {
          // Add only essential fields to avoid errors with the schema
          id,
          first_name,
          last_name,
          name_full: `${first_name} ${last_name}`,
          title: cleanedDoc.title === "NA" ? null : cleanedDoc.title,
          summary: cleanedDoc.summary === "NA" ? null : cleanedDoc.summary,
          country: cleanedDoc.country === "NA" ? null : cleanedDoc.country,
          city: cleanedDoc.city === "NA" ? null : cleanedDoc.city,
          functional_area: cleanedDoc.functional_area === "NA" ? null : cleanedDoc.functional_area,
          current_industry: cleanedDoc.current_industry === "NA" ? null : cleanedDoc.current_industry,
          linkedin_url,
          skills: normalizeSkills(cleanedDoc.expertise),
          past_employers: normalizePastEmployers(cleanedDoc.experience),
          size_buckets: getSizeBuckets(cleanedDoc.experience),
          education_signals: getEducationSignals(cleanedDoc.education),
          seniority_guess: inferSeniority(cleanedDoc.title, cleanedDoc.summary),
          // Serialize complex objects to strings
          experience: typeof cleanedDoc.experience === 'object' ? JSON.stringify(cleanedDoc.experience) : null,
          education: typeof cleanedDoc.education === 'object' ? JSON.stringify(cleanedDoc.education) : null,
        };
        
        console.log(`Processed document: ${id}`);
        
        // Add to batch
        batchDocuments.push(transformedDoc);
        
        // Process in batches for better performance
        if (batchDocuments.length >= BATCH_SIZE) {
          try {
            const importResponse = await typesense.collections('people').documents().import(
              batchDocuments, 
              { 
                action: 'create', 
                dirty_values: 'coerce_or_drop'
              }
            );
            
            // Check for failures in the batch
            const failedItems = importResponse.filter(item => item.success === false);
            if (failedItems.length > 0) {
              console.warn(`Warning: ${failedItems.length} of ${batchDocuments.length} documents failed to import in batch at line ${lineCount}`);
              // Log the first failure to help debugging
              if (failedItems[0]) {
                console.warn(`Sample error: ${JSON.stringify(failedItems[0].error)}`);
              }
              errorCount += failedItems.length;
              successCount += (batchDocuments.length - failedItems.length);
            } else {
              successCount += batchDocuments.length;
            }
          } catch (error) {
            console.error(`Batch import error near line ${lineCount}:`, error.message);
            if (error.importResults) {
              const failedItems = error.importResults.filter(item => item.success === false);
              if (failedItems.length > 0 && failedItems[0]) {
                console.error(`Sample error: ${JSON.stringify(failedItems[0].error)}`);
              }
            }
            errorCount += batchDocuments.length;
          }
          
          batchDocuments = [];
          console.log(`Processed ${lineCount} lines, ${successCount} successful, ${errorCount} failed...`);
          
          // Break after processing a few batches for testing
          if (lineCount >= 50) {
            console.log("Breaking after 50 records for initial testing");
            break;
          }
        }
      } catch (error) {
        errorCount++;
        console.error(`Error processing line ${lineCount}:`, error.message);
      }
    }
    
    // Import any remaining documents
    if (batchDocuments.length > 0) {
      try {
        const importResponse = await typesense.collections('people').documents().import(
          batchDocuments, 
          { 
            action: 'create', 
            dirty_values: 'coerce_or_drop'
          }
        );
        
        // Check for failures in the batch
        const failedItems = importResponse.filter(item => item.success === false);
        if (failedItems.length > 0) {
          console.warn(`Warning: ${failedItems.length} of ${batchDocuments.length} documents failed to import in final batch`);
          // Log the first failure to help debugging
          if (failedItems[0]) {
            console.warn(`Sample error: ${JSON.stringify(failedItems[0].error)}`);
          }
          errorCount += failedItems.length;
          successCount += (batchDocuments.length - failedItems.length);
        } else {
          successCount += batchDocuments.length;
        }
      } catch (error) {
        console.error(`Final batch import error:`, error.message);
        if (error.importResults) {
          const failedItems = error.importResults.filter(item => item.success === false);
          if (failedItems.length > 0 && failedItems[0]) {
            console.error(`Sample error: ${JSON.stringify(failedItems[0].error)}`);
          }
        }
        errorCount += batchDocuments.length;
      }
    }
    
    console.log(`ETL Process Complete:
      Total Lines: ${lineCount}
      Successfully Processed: ${successCount}
      Errors: ${errorCount}
    `);
    
    return { success: true, processed: successCount, errors: errorCount };
  } catch (error) {
    console.error('Error in ETL process:', error);
    return { success: false, error: error.message };
  }
}

// Path to the local JSONL file
const filePath = process.argv[2] || './data_1.jsonl';

// Execute the import process
processLocalFileToTypesense(filePath)
  .then(result => {
    if (result.success) {
      console.log('✅ Import completed with stats:', result);
      process.exit(0);
    } else {
      console.error('❌ Import failed:', result.error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
