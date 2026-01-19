#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <AuthenticationServices/AuthenticationServices.h>
#import <SafariServices/SafariServices.h>
#if __has_include(<FBSDKCoreKit/ApplicationDelegate.h>)
#import <FBSDKCoreKit/ApplicationDelegate.h>
#import <FBSDKCoreKit/FBSDKCoreKit.h>
#define FBSDK_AVAILABLE 1
#else
#define FBSDK_AVAILABLE 0
#endif
#import <Firebase.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [FIRApp configure];
#if FBSDK_AVAILABLE
  [[ApplicationDelegate shared] application:application didFinishLaunchingWithOptions:launchOptions];
#endif

  self.moduleName = @"StriverApp";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{{}};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self getBundleURL];
}

- (NSURL *)getBundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (BOOL)application:(UIApplication *)app
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
#if FBSDK_AVAILABLE
  if ([[ApplicationDelegate shared] application:app openURL:url options:options]) {
    return YES;
  }
#endif

  return NO;
}

@end
