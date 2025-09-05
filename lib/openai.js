import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to parse search query using OpenAI function calling
export const parseSearchQuery = async (query) => {
  try {
    // Define the function schema for OpenAI to use
    const functionSchema = {
      name: 'extract_search_filters',
      description: 'Extract structured filters from a natural language search query for candidate profiles',
      parameters: {
        type: 'object',
        properties: {
          titles_include: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Job titles to match in the candidate profile title'
          },
          skills: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Skills that the candidate should have'
          },
          past_employers: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Companies that the candidate should have worked at'
          },
          keywords: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Free text keywords to search across all fields'
          },
          country: {
            type: 'string',
            description: 'Country where the candidate is located'
          },
          city: {
            type: 'string',
            description: 'City where the candidate is located'
          },
          size_buckets: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['0-9', '10-49', '50-199', '200-499', '500-999', '1000-4999', '5000+']
            },
            description: 'Size buckets for companies the candidate has worked at'
          },
          seniority: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['cxo/founder', 'vp', 'director', 'lead/manager', 'senior', 'mid', 'junior']
            },
            description: 'Seniority levels to match'
          },
          exclude_keywords: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Keywords to exclude from search results'
          }
        }
      }
    };

    // Call OpenAI API with function calling
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a search query parser that converts natural language queries about candidate profiles into structured filters.
          
          Rules:
          1. Prefer filters over keywords when the prompt is explicit
          2. If a filter value is unknown, move it to keywords
          3. If both city and country are present, use both
          4. For ranges like "50-1000 employees", expand to the appropriate size buckets
          5. For synonyms (e.g., "leadership" → seniority), map to closest label`
        },
        {
          role: 'user',
          content: query
        }
      ],
      tools: [
        {
          type: 'function',
          function: functionSchema
        }
      ],
      tool_choice: {
        type: 'function',
        function: { name: 'extract_search_filters' }
      }
    });

    // Extract the function call response
    const toolCall = response.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No function call returned by OpenAI');
    }

    const parsedFilters = JSON.parse(toolCall.function.arguments);
    return parsedFilters;

  } catch (error) {
    console.error('Error parsing search query with OpenAI:', error);
    // Return a basic structure in case of error
    return {
      keywords: [query],
      titles_include: [],
      skills: [],
      past_employers: [],
      country: null,
      city: null,
      size_buckets: [],
      seniority: [],
      exclude_keywords: []
    };
  }
};

export default openai;
