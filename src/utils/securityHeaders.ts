/**
 * Security Headers Configuration
 * Provides comprehensive security headers for production deployment
 */

export interface SecurityHeaders {
  'Content-Security-Policy': string;
  'X-Frame-Options': string;
  'X-Content-Type-Options': string;
  'Referrer-Policy': string;
  'Permissions-Policy': string;
  'Strict-Transport-Security': string;
  'X-XSS-Protection': string;
  'Cross-Origin-Embedder-Policy': string;
  'Cross-Origin-Opener-Policy': string;
  'Cross-Origin-Resource-Policy': string;
}

export interface SecurityConfig {
  environment: 'development' | 'production';
  allowInlineScripts: boolean;
  allowInlineStyles: boolean;
  allowedDomains: string[];
  reportUri?: string;
  enableHSTS: boolean;
  hstsMaxAge: number;
  includeSubdomains: boolean;
}

export class SecurityHeadersService {
  private static config: SecurityConfig = {
    environment: 'development',
    allowInlineScripts: false,
    allowInlineStyles: false,
    allowedDomains: [],
    enableHSTS: true,
    hstsMaxAge: 31536000, // 1 year
    includeSubdomains: true
  };

  /**
   * Generate comprehensive security headers
   */
  static generateSecurityHeaders(): SecurityHeaders {
    const csp = this.generateContentSecurityPolicy();
    
    return {
      'Content-Security-Policy': csp,
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': this.generatePermissionsPolicy(),
      'Strict-Transport-Security': this.generateHSTSHeader(),
      'X-XSS-Protection': '1; mode=block',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin'
    };
  }

  /**
   * Generate Content Security Policy
   */
  private static generateContentSecurityPolicy(): string {
    const directives: string[] = [];

    // Default source
    directives.push("default-src 'self'");

    // Script sources
    const scriptSources = ["'self'"];
    if (this.config.allowInlineScripts) {
      scriptSources.push("'unsafe-inline'");
    }
    // Add Supabase and other trusted domains
    scriptSources.push('https://*.supabase.co');
    scriptSources.push('https://*.supabase.io');
    scriptSources.push('https://cdn.jsdelivr.net');
    scriptSources.push('https://unpkg.com');
    
    // Add allowed domains
    this.config.allowedDomains.forEach(domain => {
      scriptSources.push(`https://${domain}`);
    });

    directives.push(`script-src ${scriptSources.join(' ')}`);

    // Style sources
    const styleSources = ["'self'"];
    if (this.config.allowInlineStyles) {
      styleSources.push("'unsafe-inline'");
    }
    styleSources.push('https://fonts.googleapis.com');
    styleSources.push('https://cdn.jsdelivr.net');
    
    directives.push(`style-src ${styleSources.join(' ')}`);

    // Font sources
    directives.push("font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net");

    // Image sources
    const imgSources = ["'self'", 'data:', 'blob:'];
    imgSources.push('https://*.supabase.co');
    imgSources.push('https://*.supabase.io');
    
    directives.push(`img-src ${imgSources.join(' ')}`);

    // Connect sources (for API calls)
    const connectSources = ["'self'"];
    connectSources.push('https://*.supabase.co');
    connectSources.push('https://*.supabase.io');
    connectSources.push('https://api.resend.com');
    connectSources.push('https://api.sendgrid.com');
    
    // Add allowed domains for API calls
    this.config.allowedDomains.forEach(domain => {
      connectSources.push(`https://${domain}`);
    });

    directives.push(`connect-src ${connectSources.join(' ')}`);

    // Frame sources
    directives.push("frame-src 'none'");

    // Object sources
    directives.push("object-src 'none'");

    // Base URI
    directives.push("base-uri 'self'");

    // Form action
    directives.push("form-action 'self'");

    // Frame ancestors
    directives.push("frame-ancestors 'none'");

    // Upgrade insecure requests
    if (this.config.environment === 'production') {
      directives.push('upgrade-insecure-requests');
    }

    // Report URI (if configured)
    if (this.config.reportUri) {
      directives.push(`report-uri ${this.config.reportUri}`);
    }

    return directives.join('; ');
  }

  /**
   * Generate Permissions Policy
   */
  private static generatePermissionsPolicy(): string {
    const policies = [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=()',
      'battery=()',
      'bluetooth=()',
      'display-capture=()',
      'fullscreen=(self)',
      'picture-in-picture=()',
      'screen-wake-lock=()',
      'web-share=()',
      'xr-spatial-tracking=()'
    ];

    return policies.join(', ');
  }

  /**
   * Generate HSTS header
   */
  private static generateHSTSHeader(): string {
    if (!this.config.enableHSTS || this.config.environment !== 'production') {
      return '';
    }

    let header = `max-age=${this.config.hstsMaxAge}`;
    
    if (this.config.includeSubdomains) {
      header += '; includeSubDomains';
    }
    
    header += '; preload';
    
    return header;
  }

  /**
   * Update security configuration
   */
  static updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current security configuration
   */
  static getConfig(): SecurityConfig {
    return { ...this.config };
  }

  /**
   * Generate headers for Vercel deployment
   */
  static generateVercelHeaders(): Record<string, any> {
    const headers = this.generateSecurityHeaders();
    
    return {
      'headers': [
        {
          'source': '/(.*)',
          'headers': Object.entries(headers).map(([key, value]) => ({
            key,
            value
          }))
        }
      ]
    };
  }

  /**
   * Generate headers for Netlify deployment
   */
  static generateNetlifyHeaders(): string {
    const headers = this.generateSecurityHeaders();
    
    const netlifyHeaders = Object.entries(headers)
      .map(([key, value]) => `  ${key}: ${value}`)
      .join('\n');

    return `/*
${netlifyHeaders}
`;
  }

  /**
   * Generate headers for Apache deployment
   */
  static generateApacheHeaders(): string {
    const headers = this.generateSecurityHeaders();
    
    const apacheHeaders = Object.entries(headers)
      .map(([key, value]) => `Header always set ${key} "${value}"`)
      .join('\n');

    return apacheHeaders;
  }

  /**
   * Generate headers for Nginx deployment
   */
  static generateNginxHeaders(): string {
    const headers = this.generateSecurityHeaders();
    
    const nginxHeaders = Object.entries(headers)
      .map(([key, value]) => `add_header ${key} "${value}";`)
      .join('\n');

    return nginxHeaders;
  }

  /**
   * Validate security headers
   */
  static validateHeaders(headers: Record<string, string>): {
    valid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for required headers
    const requiredHeaders = [
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy'
    ];

    requiredHeaders.forEach(header => {
      if (!headers[header]) {
        issues.push(`Missing required header: ${header}`);
      }
    });

    // Check CSP
    if (headers['Content-Security-Policy']) {
      const csp = headers['Content-Security-Policy'];
      
      if (csp.includes("'unsafe-inline'") && this.config.environment === 'production') {
        recommendations.push('Consider removing unsafe-inline from CSP for production');
      }
      
      if (!csp.includes('upgrade-insecure-requests') && this.config.environment === 'production') {
        recommendations.push('Consider adding upgrade-insecure-requests to CSP');
      }
    }

    // Check HSTS
    if (!headers['Strict-Transport-Security'] && this.config.environment === 'production') {
      recommendations.push('Consider adding HSTS header for production');
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Generate security report
   */
  static generateSecurityReport(): {
    score: number;
    grade: string;
    details: {
      headers: Record<string, boolean>;
      recommendations: string[];
    };
  } {
    const headers = this.generateSecurityHeaders();
    const validation = this.validateHeaders(headers);
    
    let score = 0;
    const headerChecks: Record<string, boolean> = {};

    // Check each security header
    Object.entries(headers).forEach(([key, value]) => {
      const hasHeader = !!value;
      headerChecks[key] = hasHeader;
      if (hasHeader) score += 10;
    });

    // Calculate grade
    let grade: string;
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';

    return {
      score,
      grade,
      details: {
        headers: headerChecks,
        recommendations: validation.recommendations
      }
    };
  }
}
