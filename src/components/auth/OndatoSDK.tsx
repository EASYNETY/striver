import React from 'react';
import { View, StyleSheet } from 'react-native';

// Ondato SDK Component
// This will be imported once the SDK is installed
// import OndatoSdk from 'ondato-sdk-react-native';

interface OndatoSDKProps {
  identificationId: string;
  onSuccess: () => void;
  onError: (error: any) => void;
  onClose: () => void;
}

export const OndatoSDK: React.FC<OndatoSDKProps> = ({
  identificationId,
  onSuccess,
  onError,
  onClose,
}) => {
  // Placeholder until SDK is installed
  // Once installed, uncomment this:
  /*
  return (
    <OndatoSdk
      identificationId={identificationId}
      onSuccess={onSuccess}
      onError={onError}
      onClose={onClose}
      isConsentEnabled={true}
      isOnboardingEnabled={true}
      isLoggingEnabled={__DEV__}
      locale="en"
      theme={{
        colors: {
          primary: '#8FFBB9',
          background: '#0A0A0A',
          text: '#FFFFFF',
        },
      }}
    />
  );
  */

  return (
    <View style={styles.placeholder}>
      {/* Placeholder - SDK will render here */}
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
  },
});

export default OndatoSDK;
