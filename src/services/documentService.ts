import { DocumentItem } from '../types';
import { dbSyncService } from './dbSyncService';
import { imageKitService } from './imageKitService';

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
    docKey?: string,
    onProgress?: (progressPercent: number) => void
  ): Promise<DocumentItem> {
    if (onProgress) onProgress(20);

    let remoteFileUrl = file.uri;
    const keyPrefix = docKey || category.replace(/\s+/g, '_');
    const sanitizedFileName = `${keyPrefix}_${Date.now()}.${file.name.split('.').pop() || 'pdf'}`;

    // 1. Upload to ImageKit CDN Storage securely using backend authentication
    if (file.uri) {
      try {
        if (onProgress) onProgress(50);
        const imageKitRes = await imageKitService.uploadFile(
          file.uri,
          sanitizedFileName,
          userMobile ? `/loanpoint_vault/${userMobile}` : '/loanpoint_vault'
        );
        if (imageKitRes && imageKitRes.url) {
          remoteFileUrl = imageKitRes.url;
        }
      } catch (uploadErr) {
        console.warn('ImageKit upload fallback:', uploadErr);
      }
    }

    if (onProgress) onProgress(85);

    const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
    const newDoc: DocumentItem = {
      id: `DOC-${Math.floor(100000 + Math.random() * 900000)}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      docKey: docKey,
      category,
      fileType: ext,
      fileSizeKb: Math.round(file.size / 1024) || 120,
      uploadDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Under Review',
      fileName: file.name,
      fileUri: remoteFileUrl,
      mimeType: file.type,
    };

    if (docKey) {
      this.documents = this.documents.filter((d) => d.docKey !== docKey);
    }

    this.documents.unshift(newDoc);

    // 2. Persist to Neon Postgres DB via Backend API
    if (userMobile) {
      await dbSyncService.saveUserDocument(userMobile, newDoc);
    }

    if (onProgress) onProgress(100);

    return newDoc;
  }

  public async removeDocument(id: string, userMobile?: string): Promise<void> {
    this.documents = this.documents.filter((d) => d.id !== id);
    if (userMobile) {
      await dbSyncService.deleteUserDocument(userMobile, id);
    }
  }

  public getDocumentCount(): number {
    return this.documents.length;
  }

  public getDocumentByKey(docKey: string): DocumentItem | undefined {
    return this.documents.find((d) => d.docKey === docKey);
  }
}

export const documentService = new DocumentService();
