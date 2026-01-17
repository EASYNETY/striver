export type AgeTier = '4_12' | '13_17' | '18_plus';

export const AGE_TIERS: Record<AgeTier, { label: string; min: number; max: number }> = {
    '4_12': { label: 'Junior Baller', min: 4, max: 12 },
    '13_17': { label: 'Academy Prospect', min: 13, max: 17 },
    '18_plus': { label: 'First Teamer', min: 18, max: 120 },
};

export const PRIVACY_RULES = {
    '4_12': {
        isPrivateByDefault: true,
        canChangePrivacy: false,
        canFollowOthers: false, // Unless parent approved
        canReceiveFollows: false, // Unless parent approved
        commentsEnabled: false,
        dmsEnabled: false,
        moderationRequired: true,
        parentalApprovalForUploads: true,
        parentalApprovalForPurchases: true,
    },
    '13_17': {
        isPrivateByDefault: false,
        canChangePrivacy: true,
        canFollowOthers: true,
        canReceiveFollows: true,
        commentsEnabled: true,
        dmsEnabled: true, // Followed only
        moderationRequired: false,
        parentalApprovalForUploads: false,
        parentalApprovalForPurchases: true,
    },
    '18_plus': {
        isPrivateByDefault: false,
        canChangePrivacy: true,
        canFollowOthers: true,
        canReceiveFollows: true,
        commentsEnabled: true,
        dmsEnabled: true,
        moderationRequired: false,
        parentalApprovalForUploads: false,
        parentalApprovalForPurchases: false,
    },
};
