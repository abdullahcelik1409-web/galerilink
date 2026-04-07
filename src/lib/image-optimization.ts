import imageCompression from 'browser-image-compression';

export interface CompressionResult {
  file: File;
  previewUrl: string;
  isOptimized: boolean;
  error?: string;
}

export async function compressImage(
  imageFile: File,
  maxWidthOrHeight: number = 1200,
  initialQuality: number = 0.75
): Promise<CompressionResult> {
  const options = {
    maxSizeMB: 1, // Max size 1MB but quality usually handles it
    maxWidthOrHeight,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality,
    //@ts-ignore - browser-image-compression types might lag
    preserveExif: false,
  };

  try {
    const compressedBlob = await imageCompression(imageFile, options);
    
    // Create a new File object from the compressed Blob
    // Ensure the extension is .webp
    const fileName = imageFile.name.replace(/\.[^/.]+$/, "") + ".webp";
    const compressedFile = new File([compressedBlob], fileName, {
      type: 'image/webp',
      lastModified: Date.now(),
    });

    return {
      file: compressedFile,
      previewUrl: URL.createObjectURL(compressedFile),
      isOptimized: true,
    };
  } catch (error) {
    console.error('Image compression failed:', error);
    
    // Fallback to original file if compression fails
    return {
      file: imageFile,
      previewUrl: URL.createObjectURL(imageFile),
      isOptimized: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
