import { DocumentItem } from '../types';
import { dbSyncService } from './dbSyncService';

class DocumentService {
  private documents: DocumentItem[] = [];

  public getDocuments(): DocumentItem[] {
    return [...this.documents];
  }

  public setDocuments(docs: DocumentItem[]): void {
    this.documents = Array.isArray(docs) ? [...docs] : [];
  }

  public validateFile(file: { name: string; size: number; type: string }): { valid: boolean; error?: string } {
    const maxBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxBytes) {
      return { valid: false, error: 'File size exceeds 5MB limit. Please compress or select another file.' };
    }

    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const lowerName = file.name.toLowerCase();
    const hasValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));

    if (!hasValidExt) {
      return { valid: false, error: 'Unsupported file format. Please upload PDF, JPG, or PNG files only.' };
    }

    return { valid: true };
  }

  public async uploadDocument(
    file: { name: string; size: number; type: string; uri?: string },
    category: DocumentItem['category'],
    userMobile?: string,
    onProgress?: (progressPercent: number) => void
  ): Promise<DocumentItem> {
    if (onProgress) onProgress(25);
    await new Promise((r) => setTimeout(r, 100));

    if (onProgress) onProgress(65);
    await new Promise((r) => setTimeout(r, 100));

    if (onProgress) onProgress(90);
    await new Promise((r) => setTimeout(r, 100));

    if (onProgress) onProgress(100);

    const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
    const newDoc: DocumentItem = {
      id: `DOC-${Math.floor(100000 + Math.random() * 900000)}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      category,
      fileType: ext,
      fileSizeKb: Math.round(file.size / 1024),
      uploadDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Under Review',
      fileName: file.name,
      fileUri: file.uri,
      mimeType: file.type,
    };

    this.documents.unshift(newDoc);

    // If userMobile is provided, directly persist document to the users table in Neon Postgres
    if (userMobile) {
      await dbSyncService.saveUserDocument(userMobile, newDoc);
    }

    return newDoc;
  }

  public async removeDocument(id: string, userMobile?: string): Promise<void> {
    this.documents = this.documents.filter((d) => d.id !== id);
    if (userMobile) {
      await dbSyncService.deleteUserDocument(userMobile, id);
    }
  }
}

export const documentService = new DocumentService();
