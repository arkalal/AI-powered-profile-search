import { NextResponse } from 'next/server';
import { initializeTypesense } from '../../../../lib/typesense';
import processS3ToTypesense from '../../../../lib/s3-to-typesense';

export async function POST(req) {
  try {
    const { bucket, key } = await req.json();
    
    if (!bucket || !key) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters: bucket and key' 
      }, { status: 400 });
    }
    
    // Initialize Typesense (creates/recreates the collection)
    const initialized = await initializeTypesense();
    
    if (!initialized) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to initialize Typesense collection' 
      }, { status: 500 });
    }
    
    // Process S3 file to Typesense
    const result = await processS3ToTypesense(bucket, key);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('ETL error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
