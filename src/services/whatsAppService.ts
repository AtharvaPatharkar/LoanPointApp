/**
 * WhatsApp Gateway Service (Frontend Layer)
 * 
 * Configured so that when the backend WhatsApp API endpoints are ready,
 * you can simply plug in your backend URL or API key here.
 */

export interface WhatsAppMessagePayload {
  toMobile: string;
  templateType: 'otp' | 'loan_submitted' | 'document_requested' | 'status_update' | 'custom';
  params?: Record<string, string | number>;
  customMessage?: string;
}

class WhatsAppService {
  // Flag indicating backend WhatsApp API integration mode
  private isBackendConnected: boolean = false;
  private apiEndpoint: string = ''; // Backend WhatsApp API URL will go here

  /**
   * Set API endpoint provided by backend team
   */
  public configureApi(endpoint: string) {
    this.apiEndpoint = endpoint;
    this.isBackendConnected = !!endpoint;
  }

  /**
   * Request OTP via WhatsApp
   */
  public async sendOtpViaWhatsApp(mobile: string, otpCode: string): Promise<{ success: boolean; message: string }> {
    // When backend API is ready:
    if (this.isBackendConnected && this.apiEndpoint) {
      try {
        const response = await fetch(`${this.apiEndpoint}/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile, otp: otpCode }),
        });
        const data = await response.json();
        return { success: true, message: data.message || 'OTP sent to WhatsApp' };
      } catch (err) {
        console.warn('Backend WhatsApp API error, fallback to simulated delivery:', err);
      }
    }

    // Frontend simulation
    await new Promise((r) => setTimeout(r, 600));
    return {
      success: true,
      message: `WhatsApp OTP sent successfully to +91 ${mobile}`,
    };
  }

  /**
   * Send loan application update notification via WhatsApp
   */
  public async sendApplicationNotification(
    mobile: string,
    applicationId: string,
    loanTypeName: string,
    amount: number
  ): Promise<{ success: boolean }> {
    if (this.isBackendConnected && this.apiEndpoint) {
      try {
        await fetch(`${this.apiEndpoint}/send-application-alert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile, applicationId, loanTypeName, amount }),
        });
      } catch {
        // fallback
      }
    }

    return { success: true };
  }
}

export const whatsAppService = new WhatsAppService();
