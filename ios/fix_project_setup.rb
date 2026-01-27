require 'xcodeproj'

project_path = 'StriverApp.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# 1. Add GoogleService-Info.plist if missing
google_service_file = 'GoogleService-Info.plist'
# The file is physically in StriverApp/GoogleService-Info.plist (based on directory listing step 26)
# But also in ios/GoogleService-Info.plist (step 12)
# We usually want the one in the group "StriverApp" mapping to StriverApp/GoogleService-Info.plist

# Find the main group "StriverApp"
main_group = project.main_group.find_sub_group('StriverApp')
if main_group.nil?
  puts "Error: StriverApp group not found!"
  exit 1
end

# Check if file reference exists
file_ref = main_group.files.find { |f| f.path =~ /GoogleService-Info.plist/ }

if file_ref
  puts "GoogleService-Info.plist is already in the project."
else
  puts "Adding GoogleService-Info.plist to project..."
  # We assume the file is at StriverApp/GoogleService-Info.plist relative to project root
  file_ref = main_group.new_file('StriverApp/GoogleService-Info.plist')
  
  # Add to main target
  target = project.targets.find { |t| t.name == 'StriverApp' }
  if target
    target.add_resources([file_ref])
    puts "Added to target StriverApp resources."
  else
    puts "Error: Target StriverApp not found!"
  end
end

# 2. Add video file reference if likely missing (though not confirmed missing)
# assets/videos/gs_intro.mp4
# Usually assets are linked via 'Link Binary With Libraries' or 'Copy Bundle Resources' if they are in the project.
# But for React Native, usually we rely on 'index.js' require() which Metro bundles, OR we link them as resources.
# If 'react-native-video' uses URI from require(), Metro handles it.
# Check if Metro config works. 
# BUT, large videos are often better added as resources.
# WelcomeScreen uses: source={require('../../../assets/videos/gs_intro.mp4')}
# This means Metro will bundle it. It does NOT need to be in PBXProj.

project.save
puts "Project saved."
