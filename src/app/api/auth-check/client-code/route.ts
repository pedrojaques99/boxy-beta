import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  // Only allow in development or if ENABLE_AUTH_DIAGNOSTICS is set
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_AUTH_DIAGNOSTICS !== 'true') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    )
  }

  try {
    // Path to the client.ts file
    const filePath = path.join(process.cwd(), 'src', 'lib', 'supabase', 'client.ts')
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }
    
    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf8')
    
    // Sanitize the content to remove sensitive information
    const sanitizedContent = fileContent
      .replace(/process\.env\.NEXT_PUBLIC_SUPABASE_URL/g, '"SUPABASE_URL"')
      .replace(/process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY/g, '"SUPABASE_ANON_KEY"')
      .replace(/supabaseUrl,\s*supabaseAnonKey/g, '"SUPABASE_URL", "SUPABASE_ANON_KEY"')
    
    // Return the content as plain text
    return new NextResponse(sanitizedContent, {
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  } catch (error) {
    console.error('Error reading client file:', error)
    return NextResponse.json(
      { error: 'Failed to read client implementation' },
      { status: 500 }
    )
  }
} 