import React from 'react';
import { View } from 'react-native';
import FeedItem from './FeedItem'; // Adjust path if needed
import { COLORS } from '../constants/theme';
import { Post } from '../api/postService';

export default {
    title: 'FeedItem',
    component: FeedItem,
    decorators: [
        (Story: any) => (
            <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center' }}>
                <Story />
            </View>
        ),
    ],
};

const mockPost: Post = {
    id: '1',
    userId: 'user1',
    username: 'johndoe',
    userAvatar: 'https://ui-avatars.com/api/?name=John+Doe',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
    caption: 'Check out this amazing video! #fun #viral',
    hashtags: ['fun', 'viral'],
    likes: 120,
    comments: 45,
    shares: 12,
    coins: 10,
    status: 'active',
    createdAt: new Date(),
};

export const Default = () => (
    <FeedItem
        item={mockPost}
        isVisible={true}
        isFocused={true}
        isLiked={false}
        isFollowing={false}
        onLike={() => console.log('Like')}
        onShare={() => console.log('Share')}
        onComment={() => console.log('Comment')}
        onFollow={() => console.log('Follow')}
        onProfilePress={() => console.log('Profile')}
    />
);

export const Liked = () => (
    <FeedItem
        item={{ ...mockPost, likes: 121 }}
        isVisible={true}
        isFocused={true}
        isLiked={true}
        isFollowing={false}
        onLike={() => console.log('Like')}
        onShare={() => console.log('Share')}
        onComment={() => console.log('Comment')}
        onFollow={() => console.log('Follow')}
        onProfilePress={() => console.log('Profile')}
    />
);
