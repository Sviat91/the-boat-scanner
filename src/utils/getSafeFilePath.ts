import { v4 as uuid } from 'uuid';
export const getSafeFilePath = (file: File, userId: string) => {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  return `${userId}/${uuid()}.${ext}`;
};
