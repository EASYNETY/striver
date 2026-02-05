/**
 * Ondato Service
 * 
 * Direct API integration with Ondato via Cloudflare Worker proxy.
 * This eliminates Firebase authentication issues by bypassing Firebase Functions.
 */

// Cloudflare Worker URL
const CLOUDFLARE_WORKER_URL = 'https://ondato-proxy.striverapp.workers.dev';

export interface CreateSessionParams {
  externalReferenceId: string;
  language?: string;
  dateOfBirth?: string;
}

export interface CreateSessionResult {
  success: boolean;
  sessionId?: string;
  identificationId?: string;
  verificationUrl?: string;
  error?: string;
}

export interface CheckStatusParams {
  sessionId: string;
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
      console.log('[OndatoService] Starting session creation for:', params.externalReferenceId);
      console.log('[OndatoService] Worker URL:', CLOUDFLARE_WORKER_URL);

      // First, try a simple connectivity test to see if we can even reach the worker
      try {
        const healthCheck = await fetch(`${CLOUDFLARE_WORKER_URL}/health`, { method: 'GET' });
        console.log('[OndatoService] Pre-flight health check status:', healthCheck.status);
      } catch (healthError: any) {
        console.warn('[OndatoService] Pre-flight health check failed:', healthError.message);
        // We continue anyway, but this is a strong hint of network issues
      }

      const requestBody = {
        externalReferenceId: params.externalReferenceId,
        language: params.language || 'en',
      };

      console.log('[OndatoService] Sending POST request...');

      const response = await fetch(`${CLOUDFLARE_WORKER_URL}/create-session`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[OndatoService] Response status:', response.status);
      const data = await response.json();
      console.log('[OndatoService] Response data success:', !!data.success);

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
      console.error('[OndatoService] NETWORK ERROR:', error.name, '-', error.message);

      // Diagnostic info
      const diagnosticInfo = {
        message: error.message,
        name: error.name,
        stack: error.stack?.substring(0, 200),
        url: `${CLOUDFLARE_WORKER_URL}/create-session`,
      };

      console.error('[OndatoService] Diagnostic details:', JSON.stringify(diagnosticInfo));

      return {
        success: false,
        error: `Network error: ${error.message || 'Check your internet connection'}`,
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
      console.log('[OndatoService] Checking status via Worker:', params.sessionId);

      // Note: params.sessionId here maps to identificationId for the worker
      const response = await fetch(`${CLOUDFLARE_WORKER_URL}/check-status/${params.sessionId}`, {
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
        verificationData: data.verificationData || {},
        rejectionReasons: data.rejectionReasons || [],
      };

    } catch (error: any) {
      console.error('[OndatoService] Check status error:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to check status',
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
