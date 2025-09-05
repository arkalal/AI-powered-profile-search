import { NextResponse } from 'next/server';
import typesense from '../../../../lib/typesense';
import { parseSearchQuery } from '../../../../lib/openai';

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    
    // No prompt provided
    if (!prompt) {
      return NextResponse.json({ error: 'No search prompt provided' }, { status: 400 });
    }

    // Step 1: Parse the prompt using OpenAI function calling
    const parsedFilters = await parseSearchQuery(prompt);
    
    // Step 2: Construct Typesense search query
    const searchParameters = {
      q: [...(parsedFilters.titles_include || []), ...(parsedFilters.keywords || [])].join(' '),
      query_by: 'title,summary,skills,past_employers,education',
      filter_by: constructFilterString(parsedFilters),
      facet_by: 'skills,past_employers,size_buckets,city,country,education_signals,seniority_guess',
      page: 1,
      per_page: 20,
    };

    // Step 3: Execute search
    const searchResults = await typesense
      .collections('people')
      .documents()
      .search(searchParameters);

    // Step 4: Return parsed filters and search results
    return NextResponse.json({
      parsedFilters,
      results: searchResults,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to construct filter string for Typesense
function constructFilterString(parsedFilters) {
  const filters = [];
  
  // Add country filter if present
  if (parsedFilters.country) {
    filters.push(`country:=${parsedFilters.country}`);
  }
  
  // Add city filter if present
  if (parsedFilters.city) {
    filters.push(`city:=${parsedFilters.city}`);
  }
  
  // Add skills filter if present
  if (parsedFilters.skills && parsedFilters.skills.length > 0) {
    const skillsFilter = parsedFilters.skills.map(skill => `skills:=${skill}`).join(' && ');
    filters.push(`(${skillsFilter})`);
  }
  
  // Add past employers filter if present
  if (parsedFilters.past_employers && parsedFilters.past_employers.length > 0) {
    const employersFilter = parsedFilters.past_employers.map(emp => `past_employers:=${emp}`).join(' || ');
    filters.push(`(${employersFilter})`);
  }
  
  // Add size buckets filter if present
  if (parsedFilters.size_buckets && parsedFilters.size_buckets.length > 0) {
    const sizeFilter = parsedFilters.size_buckets.map(size => `size_buckets:=${size}`).join(' || ');
    filters.push(`(${sizeFilter})`);
  }
  
  // Add seniority filter if present
  if (parsedFilters.seniority && parsedFilters.seniority.length > 0) {
    const seniorityFilter = parsedFilters.seniority.map(level => `seniority_guess:=${level}`).join(' || ');
    filters.push(`(${seniorityFilter})`);
  }
  
  return filters.join(' && ');
}
