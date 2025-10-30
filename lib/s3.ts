import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

// Check if S3 is configured
// Note: AWS Amplify doesn't allow env vars starting with "AWS_"
// so we use S3_ prefix instead
const isS3Configured = !!(
  process.env.S3_ACCESS_KEY_ID &&
  process.env.S3_SECRET_ACCESS_KEY &&
  process.env.S3_BUCKET &&
  process.env.S3_REGION
)

// Initialize S3 client only if configured
const s3Client = isS3Configured
  ? new S3Client({
      region: process.env.S3_REGION!,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!
      }
    })
  : null

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
  if (!s3Client) {
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

    await s3Client.send(command)

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
  if (!s3Client) {
    throw new Error('S3 is not configured. Please set AWS environment variables.')
  }

  const command = new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key
  })

  await s3Client.send(command)
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
 */
export function isS3Available(): boolean {
  return isS3Configured
}

