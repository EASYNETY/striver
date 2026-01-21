declare module 'react-native-video' {
    import { Component } from 'react';
    import { ViewProps } from 'react-native';

    export interface VideoProps extends ViewProps {
        source: { uri?: string } | number;
        resizeMode?: 'stretch' | 'contain' | 'cover' | 'none';
        repeat?: boolean;
        paused?: boolean;
        muted?: boolean;
        volume?: number;
        rate?: number;
        playInBackground?: boolean;
        playWhenInactive?: boolean;
        onLoad?: (data: any) => void;
        onProgress?: (data: any) => void;
        onEnd?: () => void;
        onError?: (error: any) => void;
        onBuffer?: (data: any) => void;
        onTimedMetadata?: (data: any) => void;
    }

    export default class Video extends Component<VideoProps> { }
}
