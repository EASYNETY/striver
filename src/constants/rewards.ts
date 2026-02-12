
// Career Progression Tiers (10 Tiers)
// These represent the user's career level based on coins earned.
export const CAREER_TIERS = [
    { id: 'future_star', name: 'Future Star', color: '#A8F6BD', threshold: 0, benefits: ['Digital Onboarding', 'Basic Frames'] },
    { id: 'academy', name: 'Academy', color: '#7EEFD3', threshold: 100, benefits: ['Squad Invites', 'Bronze Status'] },
    { id: 'non_league', name: 'Non-League', color: '#7FD8F7', threshold: 300, benefits: ['Comment on Videos', 'Silver Status'] },
    { id: 'baller', name: 'Baller', color: '#C7A8FF', threshold: 600, benefits: ['Custom Profile Links', 'Premium Frames'] },
    { id: 'challenger', name: 'Challenger', color: '#FFA8BF', threshold: 1200, benefits: ['Unlimited Squads', 'Gold Status'] },
    { id: 'elite', name: 'Elite', color: '#FFB4A8', threshold: 2500, benefits: ['Early Access Features', 'Verified Checkmark (Blue)'] },
    { id: 'world_class', name: 'World Class', color: '#FFC79A', threshold: 5000, benefits: ['Platinum Status', 'Direct Legend Access'] },
    { id: 'icon', name: 'Icon', color: '#FFF5A8', threshold: 10000, benefits: ['VIP Event Invites', 'Exclusive Merchandise'] },
    { id: 'legend', name: 'Legend', color: '#DDE2E8', threshold: 20000, benefits: ['Diamond Status', 'In-App Mentorship'] },
    { id: 'goat', name: 'GOAT', color: '#F7E9A0', threshold: 50000, benefits: ['Hall of Fame Profile', 'All-Access Pass'] },
];

// Badge Status System (5 Badges)
// These are prominent UI badges, likely mapping to ranges of the career tiers.
export const BADGE_TIERS = [
    { id: 'bronze', name: 'Bronze', color: '#cd7f32', tierRange: ['future_star', 'academy'] },
    { id: 'silver', name: 'Silver', color: '#c0c0c0', tierRange: ['non_league', 'baller'] },
    { id: 'gold', name: 'Gold', color: '#ffd700', tierRange: ['challenger', 'elite'] },
    { id: 'platinum', name: 'Platinum', color: '#e5e4e2', tierRange: ['world_class', 'icon'] },
    { id: 'diamond', name: 'Diamond', color: '#b9f2ff', tierRange: ['legend', 'goat'] },
];

export const EARNING_RULES = {
    daily: {
        login: 5,
        streak_7_day: 10,
        watch_5_videos: 10,
        post_response: 15,
        complete_challenge: 20,
        like_posts: 2, // Small reward for engagement
    },
    weekly: {
        participate_legend_challenge: 50,
        get_10_likes: 25,
        join_squad: 20,
        completion_bonus: 100,
    },
    milestones: {
        first_video: 50,
        followers_100: 100,
        views_1000: 75,
    },
    special: {
        birthday: 100,
    }
};

export const SPENDING_RULES = {
    junior_baller: {
        max_daily_spend: 50,
        allowed_categories: ['digital'], // frames, card_packs
        requires_supervision: true,
    },
    academy_prospect: {
        allowed_categories: ['digital', 'physical'],
        physical_requires_approval: true,
    },
    first_teamer: {
        allowed_categories: ['all'],
        can_export_history: true,
    }
};
