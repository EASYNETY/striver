import { differenceInYears } from 'date-fns';
import { AgeTier } from '../api/userService';

// Helper to calculate age from DOB string (YYYY-MM-DD) or Date object
export const calculateAge = (dob: string | Date): number => {
    const dateOfBirth = typeof dob === 'string' ? new Date(dob) : dob;
    return differenceInYears(new Date(), dateOfBirth);
};

// Determine Striver Age Tier
export const determineAgeTier = (age: number): AgeTier => {
    if (age < 13) return 'junior_baller';
    if (age < 18) return 'academy_prospect';
    return 'first_teamer';
};

// Unified helper for RewardService (matches the call pattern used there)
export const checkAgeTier = (dob: string | Date): AgeTier => {
    const age = calculateAge(dob);
    return determineAgeTier(age);
};

// Check if user is eligible for Individual Account
export const isEligibleForIndividual = (age: number): boolean => {
    return age >= 13;
};

// Format Date for Input
export const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
};
