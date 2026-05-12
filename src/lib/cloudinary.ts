const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

export async function uploadToCloudinary(
  fileUri: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<string> {
  const formData = new FormData();
  const ext = fileUri.split('.').pop() ?? (resourceType === 'video' ? 'mp4' : 'jpg');
  const mime = resourceType === 'video' ? `video/${ext}` : `image/${ext}`;

  formData.append('file', { uri: fileUri, type: mime, name: `upload.${ext}` } as unknown as Blob);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'powerlink');

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) throw new Error('Falha no upload para o Cloudinary');

  const data = await res.json();
  return data.secure_url as string;
}

export function cloudinaryVideoThumbnail(videoUrl: string): string {
  // Substitui /upload/ por /upload/so_0,w_400/ e troca extensão por .jpg
  return videoUrl
    .replace('/upload/', '/upload/so_0,w_400/')
    .replace(/\.[^.]+$/, '.jpg');
}
