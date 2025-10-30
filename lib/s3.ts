import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

// Lazy-initialized S3 client (created on first use)
// This ensures environment variables are loaded before checking them
let s3Client: S3Client | null = null
let s3Initialized = false

/**
 * Get or create S3 client
 * Lazy initialization ensures env vars are available
 */
function getS3Client(): S3Client | null {
  if (s3Initialized) {
    return s3Client
  }

  // Check if S3 is configured (do this at runtime, not module load time)
  // Note: AWS Amplify doesn't allow env vars starting with "AWS_"
  // so we use S3_ prefix instead
  const isConfigured = !!(
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY &&
    process.env.S3_BUCKET &&
    process.env.S3_REGION
  )

  if (isConfigured) {
    console.log('[S3] Initializing S3 client with region:', process.env.S3_REGION)
    s3Client = new S3Client({
      region: process.env.S3_REGION!,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!
      }
    })
  } else {
    console.log('[S3] S3 not configured - environment variables missing')
    s3Client = null
  }

  s3Initialized = true
  return s3Client
}

/**
 * Upload a file to S3
 * @param key - The S3 object key (path/filename)
 * @param buffer - File buffer
 * @param contentType - MIME type
 * @returns The public URL of the uploaded file
 */
export async function uploadToS3(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const client = getS3Client()
  
  if (!client) {
    throw new Error('S3 is not configured. Please set S3 environment variables.')
  }

  const bucket = process.env.S3_BUCKET!

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType
      // NOTE: ACL removed - use bucket policy for public read access instead
      // This avoids issues with "Block public ACLs" bucket settings
    })

    await client.send(command)

    // Return the public URL
    // Format: https://{bucket}.s3.{region}.amazonaws.com/{key}
    const region = process.env.S3_REGION!
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`
  } catch (error) {
    console.error('[S3 Upload] Error uploading to S3:', error)
    console.error('[S3 Upload] Bucket:', bucket)
    console.error('[S3 Upload] Key:', key)
    console.error('[S3 Upload] Region:', process.env.S3_REGION)
    throw error
  }
}

/**
 * Delete a file from S3
 * @param key - The S3 object key (path/filename)
 */
export async function deleteFromS3(key: string): Promise<void> {
  const client = getS3Client()
  
  if (!client) {
    throw new Error('S3 is not configured. Please set S3 environment variables.')
  }

  const command = new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key
  })

  await client.send(command)
}

/**
 * Extract S3 key from a full S3 URL
 * @param url - Full S3 URL
 * @returns The S3 key or null if not an S3 URL
 */
export function extractS3Key(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname
    
    // Match pattern: bucket.s3.region.amazonaws.com
    if (hostname.includes('.s3.') && hostname.includes('.amazonaws.com')) {
      // Return everything after the domain
      return urlObj.pathname.substring(1) // Remove leading slash
    }
    
    return null
  } catch {
    return null
  }
}

/**
 * Check if S3 storage is available
 * Uses lazy initialization to ensure env vars are loaded
 */
export function isS3Available(): boolean {
  const client = getS3Client()
  return client !== null
}

