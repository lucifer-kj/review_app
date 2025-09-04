import { EmailService } from './emailService';

// Simple test to verify EmailService functionality
describe('EmailService', () => {
  const mockData = {
    customerEmail: 'test@example.com',
    customerName: 'John Doe',
    businessName: 'Test Business',
    managerName: 'Jane Manager',
    trackingId: 'test-123'
  };

  test('generateReviewEmailTemplate should create valid email data', () => {
    const emailData = EmailService.generateReviewEmailTemplate(mockData);
    
    expect(emailData).toHaveProperty('to');
    expect(emailData).toHaveProperty('subject');
    expect(emailData).toHaveProperty('body');
    
    expect(emailData.to).toBe('test@example.com');
    expect(emailData.subject).toBe('We\'d love your feedback, John Doe!');
    expect(emailData.body).toContain('Hello John Doe');
    expect(emailData.body).toContain('Test Business');
    expect(emailData.body).toContain('Requested by: Jane Manager');
    expect(emailData.body).toContain('utm_source=email');
    expect(emailData.body).toContain('tracking_id=test-123');
  });

  test('generateTextEmail should create valid text email', () => {
    const textEmail = EmailService.generateTextEmail(mockData);
    
    expect(textEmail).toContain('Review Request Email Template');
    expect(textEmail).toContain('To: [Customer Email]');
    expect(textEmail).toContain('Subject: We\'d love your feedback, John Doe!');
    expect(textEmail).toContain('Hello John Doe');
    expect(textEmail).toContain('Test Business');
    expect(textEmail).toContain('Requested by: Jane Manager');
  });

  test('openEmailClient should not throw error', () => {
    const emailData = EmailService.generateReviewEmailTemplate(mockData);
    
    // Mock window.open to prevent actual email client opening during tests
    const originalOpen = window.open;
    window.open = jest.fn();
    
    expect(() => EmailService.openEmailClient(emailData)).not.toThrow();
    
    // Restore original window.open
    window.open = originalOpen;
  });

  test('copyEmailToClipboard should work with valid data', async () => {
    const emailData = EmailService.generateReviewEmailTemplate(mockData);
    
    // Mock navigator.clipboard
    const mockClipboard = {
      writeText: jest.fn().mockResolvedValue(undefined)
    };
    Object.assign(navigator, { clipboard: mockClipboard });
    
    const result = await EmailService.copyEmailToClipboard(emailData);
    
    expect(result).toBe(true);
    expect(mockClipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('To: test@example.com')
    );
  });
});
