import { Share, Platform } from 'react-native';

const APP_SCHEME = 'striver://';
const WEB_BASE_URL = 'https://striver-links.web.app';

export const generateDeepLink = (type: 'post' | 'profile' | 'squad', id: string) => {
    return `${APP_SCHEME}${type}/${id}`;
};

export const shareContent = async (title: string, message: string, type: 'post' | 'profile' | 'squad', id: string) => {
    const webLink = `${WEB_BASE_URL}/${type}/${id}`;
    const fullMessage = Platform.OS === 'ios'
        ? `${message}\n\nCheck it out!`
        : `${message}\n\n${webLink}`;

    try {
        const result = await Share.share({
            title: title,
            message: fullMessage,
            url: webLink, // Works on both platforms
        });
        return result;
    } catch (error) {
        console.error('Error sharing content:', error);
    }
};
