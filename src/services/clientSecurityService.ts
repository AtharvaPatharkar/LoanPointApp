import * as ScreenCapture from 'expo-screen-capture';
import { Platform } from 'react-native';

/**
 * Security Service for Client-Side Protection:
 * - Screen Privacy / Anti-Screenshot protection on sensitive screens (PAN, Aadhaar, KYC, Bank details)
 * - Environment awareness (in development/testing mode, non-blocking logs so developers can still take screenshots for bug reports)
 */
class ClientSecurityService {
  private isScreenProtectionActive: boolean = false;

  /**
   * Activate screenshot and screen recording blocking
   */
  public async enableScreenProtection(reason: string = 'Sensitive KYC/Financial data'): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      if (__DEV__) {
        console.log(`[Security Protection Active (Dev Mode)]: Screen protection requested for: ${reason}`);
      }
      await ScreenCapture.preventScreenCaptureAsync();
      this.isScreenProtectionActive = true;
    } catch (err: any) {
      console.warn('[ScreenCapture Warning]:', err.message);
    }
  }

  /**
   * Deactivate screenshot blocking when leaving sensitive screen
   */
  public async disableScreenProtection(): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      await ScreenCapture.allowScreenCaptureAsync();
      this.isScreenProtectionActive = false;
    } catch (err: any) {
      console.warn('[ScreenCapture Allow Warning]:', err.message);
    }
  }

  public isProtected(): boolean {
    return this.isScreenProtectionActive;
  }
}

export const clientSecurityService = new ClientSecurityService();
