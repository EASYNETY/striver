/**
 * Ondato Service
 * 
 * Direct API integration with Ondato via Cloudflare Worker proxy.
 * This eliminates Firebase authentication issues by bypassing Firebase Functions.
 */

// Cloudflare Worker URL - deployed successfully!
const CLOUDFLARE_WORKER_URL = 'https://ondato-proxy.striverapp.workers.dev';

export interface CreateSessionParams {
  externalReferenceId: string;
  language?: string;
}

export interface CreateSessionResult {
  success: boolean;
  sessionId?: string;
  identificationId?: string;
  verificationUrl?: string;
  error?: string;
}

export interface CheckStatusParams {
  identificationId: string;
}

export interface CheckStatusResult {
  success: boolean;
  status?: 'pending' | 'completed' | 'failed';
  ondatoStatus?: string;
  verificationData?: any;
  rejectionReasons?: string[];
  error?: string;
}

/**
 * Ondato Service
 * 
 * Provides functions to interact with Ondato API via Cloudflare Worker proxy
 */
export const ondatoService = {
  /**
   * Create a new Ondato verification session
   * 
   * @param params - Session creation parameters
   * @returns Session creation result with verification URL
   */
  async createSession(params: CreateSessionParams): Promise<CreateSessionResult> {
    try {
      console.log('[OndatoService] Creating session:', params.externalReferenceId);
      console.log('[OndatoService] Worker URL:', CLOUDFLARE_WORKER_URL);
      
      const requestBody = {
        externalReferenceId: params.externalReferenceId,
        language: params.language || 'en',
      };
      console.log('[OndatoService] Request body:', JSON.stringify(requestBody));
      
      const response = await fetch(`${CLOUDFLARE_WORKER_URL}/create-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[OndatoService] Response status:', response.status);
      const data = await response.json();
      console.log('[OndatoService] Response data:', JSON.stringify(data));

      if (!response.ok || !data.success) {
        console.error('[OndatoService] Create session failed:', data);
        return {
          success: false,
          error: data.error || 'Failed to create verification session',
        };
      }

      console.log('[OndatoService] Session created successfully:', data.identificationId);
      return {
        success: true,
        sessionId: data.sessionId,
        identificationId: data.identificationId,
        verificationUrl: data.verificationUrl,
      };

    } catch (error: any) {
      console.error('[OndatoService] Create session error:', error);
      console.error('[OndatoService] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      return {
        success: false,
        error: error.message || 'Network error creating session',
      };
    }
  },

  /**
   * Check the status of an Ondato verification session
   * 
   * @param params - Status check parameters
   * @returns Current verification status
   */
  async checkStatus(params: CheckStatusParams): Promise<CheckStatusResult> {
    try {
      console.log('[OndatoService] Checking status:', params.identificationId);
      
      const response = await fetch(`${CLOUDFLARE_WORKER_URL}/check-status/${params.identificationId}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error('[OndatoService] Check status failed:', data);
        return {
          success: false,
          error: data.error || 'Failed to check verification status',
        };
      }

      console.log('[OndatoService] Status retrieved:', data.status);
      return {
        success: true,
        status: data.status,
        ondatoStatus: data.ondatoStatus,
        verificationData: data.verificationData,
        rejectionReasons: data.rejectionReasons,
      };

    } catch (error: any) {
      console.error('[OndatoService] Check status error:', error);
      return {
        success: false,
        error: error.message || 'Network error checking status',
      };
    }
  },

  /**
   * Test worker connectivity
   * 
   * @returns Health check result
   */
  async healthCheck(): Promise<{ ok: boolean; message?: string }> {
    try {
      const response = await fetch(`${CLOUDFLARE_WORKER_URL}/health`);
      const data = await response.json();
      
      if (response.ok && data.status === 'ok') {
        console.log('[OndatoService] Health check passed');
        return { ok: true, message: data.message };
      }
      
      return { ok: false, message: 'Worker not responding correctly' };
    } catch (error: any) {
      console.error('[OndatoService] Health check failed:', error);
      return { ok: false, message: error.message };
    }
  },
};

export default ondatoService;
