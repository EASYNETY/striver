import analytics from '@react-native-firebase/analytics';

export type UserProperties = {
    age_tier: '4_12' | '13_17' | '18_plus';
    account_type: 'family' | 'individual';
    country?: string;
    user_tier: string;
    parent_linked: boolean;
};

export const logUserProperties = async (props: UserProperties) => {
    await analytics().setUserProperties({
        age_tier: props.age_tier,
        account_type: props.account_type,
        country: props.country || 'unknown',
        user_tier: props.user_tier,
        parent_linked: props.parent_linked.toString(),
    });
};

export const logEvent = async (name: string, params?: object) => {
    // Rule: NO behavioural profiling of under-13 users
    // We'll check the current user's age tier before logging certain events
    // For now, we'll log generic events
    await analytics().logEvent(name, params);
};

export const EVENTS = {
    FIRST_OPEN: 'app_launched',
    ONBOARDING_COMPLETED: 'onboarding_step_completed',
    ACCOUNT_TYPE_SELECTED: 'account_type_selected',
    SIGNUP_COMPLETED: 'signup_completed',
    LOGIN: 'login',
    VIDEO_UPLOAD_STARTED: 'video_upload_started',
    VIDEO_UPLOAD_COMPLETED: 'video_upload_completed',
    RESPONSE_CREATED: 'response_created',
    CHALLENGE_JOINED: 'challenge_joined',
    SQUAD_JOINED: 'squad_joined',
    REWARD_EARNED: 'reward_earned',
    REWARD_SPENT: 'reward_spent',
    MODERATION_APPROVED: 'moderation_approved',
    MODERATION_REJECTED: 'moderation_rejected',
    PAYMENT_STARTED: 'payment_started',
    PAYMENT_COMPLETED: 'payment_completed',
};
