/**
 * @deprecated This service has been replaced by MagicLinkService
 * 
 * The InvitationService has been deprecated in favor of the streamlined MagicLinkService.
 * Use MagicLinkService.inviteUserWithMagicLink() instead.
 * 
 * This file is kept for reference but should not be used in new code.
 * It will be removed in a future version.
 */

import { MagicLinkService } from './magicLinkService';

export class InvitationService {
  /**
   * @deprecated Use MagicLinkService.inviteUserWithMagicLink() instead
   */
  static async sendInvitation() {
    throw new Error('InvitationService is deprecated. Use MagicLinkService.inviteUserWithMagicLink() instead.');
  }

  /**
   * @deprecated Use MagicLinkService.inviteUserWithMagicLink() instead
   */
  static async createUserAndInvite() {
    throw new Error('InvitationService is deprecated. Use MagicLinkService.inviteUserWithMagicLink() instead.');
  }
}