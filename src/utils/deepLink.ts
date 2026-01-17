import { Share, Platform } from 'react-native';

const APP_SCHEME = 'striver://';
const WEB_BASE_URL = 'https://striver-app-demo.web.app'; // Mock fallback

export const generateDeepLink = (type: 'post' | 'profile' | 'squad', id: string) => {
    return `${APP_SCHEME}${type}/${id}`;
};

export const shareContent = async (title: string, message: string, type: 'post' | 'profile' | 'squad', id: string) => {
    const deepLink = generateDeepLink(type, id);
    const fullMessage = `${message}\n\nOpen in Striver: ${deepLink}\nOr on the web: ${WEB_BASE_URL}/${type}/${id}`;

    try {
        const result = await Share.share({
            title: title,
            message: fullMessage,
            url: Platform.OS === 'ios' ? deepLink : undefined, // iOS supports URL directly
        });
        return result;
    } catch (error) {
        console.error('Error sharing content:', error);
    }
};
