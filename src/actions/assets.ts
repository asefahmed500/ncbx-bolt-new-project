
"use server";

import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@/auth';

// Configure Cloudinary with your credentials from .env
// This configuration should ideally happen once, e.g., in a separate config file or at app startup,
// but for server actions, configuring it here is also acceptable.
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error("Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not fully set.");
  // Depending on strictness, you might throw an error or allow proceeding with limited functionality.
} else {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });
}


interface CloudinarySignatureResult {
  signature?: string;
  timestamp?: number;
  apiKey?: string;
  cloudName?: string;
  error?: string;
}

/**
 * Generates a signature for direct client-side uploads to Cloudinary.
 * @param paramsToSign - An object of parameters to include in the signature.
 *                       Typically includes `timestamp` and may include `folder`, `public_id`, etc.
 * @returns An object containing the signature, timestamp, API key, and cloud name, or an error message.
 */
export async function getCloudinarySignature(
  paramsToSign: Record<string, any> = {}
): Promise<CloudinarySignatureResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "User not authenticated. Cannot generate upload signature." };
  }

  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_CLOUD_NAME) {
    return { error: "Cloudinary is not configured on the server." };
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const paramsWithTimestamp = { ...paramsToSign, timestamp };

  try {
    // The api_sign_request method requires the API secret, so it must be called server-side.
    const signature = cloudinary.utils.api_sign_request(
      paramsWithTimestamp,
      process.env.CLOUDINARY_API_SECRET // This must be your API Secret
    );

    return {
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    };
  } catch (error: any) {
    console.error("[CloudinarySignature] Error generating signature:", error);
    return { error: "Failed to generate Cloudinary upload signature: " + error.message };
  }
}

// Example of how to use this from the client:
/*
async function handleFileUpload(file, folderName = 'user_assets') {
  try {
    // 1. Get signature from backend
    const signatureResult = await getCloudinarySignature({ folder: folderName });
    if (signatureResult.error || !signatureResult.signature || !signatureResult.timestamp || !signatureResult.apiKey || !signatureResult.cloudName) {
      console.error('Failed to get Cloudinary signature:', signatureResult.error);
      // Show error to user
      return;
    }

    // 2. Prepare FormData for direct upload to Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signatureResult.apiKey);
    formData.append('timestamp', signatureResult.timestamp.toString());
    formData.append('signature', signatureResult.signature);
    formData.append('folder', folderName); // Optional: specify a folder in Cloudinary

    // 3. Make the POST request to Cloudinary
    const cloudinaryUploadUrl = `https://api.cloudinary.com/v1_1/${signatureResult.cloudName}/image/upload`;
    const response = await fetch(cloudinaryUploadUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.secure_url) {
      console.log('Upload successful! Image URL:', data.secure_url);
      // Use data.secure_url in your application
    } else {
      console.error('Cloudinary upload failed:', data.error?.message || 'Unknown error');
      // Show error to user
    }
  } catch (error) {
    console.error('Error during file upload process:', error);
    // Show error to user
  }
}
*/
