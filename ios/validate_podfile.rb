#!/usr/bin/env ruby

# Podfile Validation Script for React Native 0.75.4 Compatibility
# This script validates that the Podfile configuration is compatible with React Native 0.75.4

require 'cocoapods'

puts "🔍 Validating Podfile configuration for React Native 0.75.4 compatibility..."

# Change to iOS directory
Dir.chdir(File.dirname(__FILE__))

# Check if Podfile exists
unless File.exist?('Podfile')
  puts "❌ Podfile not found!"
  exit 1
end

puts "✅ Podfile found"

# Read and validate Podfile content
podfile_content = File.read('Podfile')

# Check for React Native 0.75.4 compatibility requirements
validations = [
  {
    name: "min_ios_version_supported usage",
    pattern: /min_ios_version_supported/,
    required: true
  },
  {
    name: "Static framework linkage",
    pattern: /use_frameworks!\s*:linkage\s*=>\s*:static/,
    required: true
  },
  {
    name: "Conditional FlipperConfiguration",
    pattern: /FlipperConfiguration\.(enabled|disabled)/,
    required: true
  },
  {
    name: "React Native post-install hook",
    pattern: /react_native_post_install/,
    required: true
  },
  {
    name: "Firebase SDK version pinning",
    pattern: /\$FirebaseSDKVersion\s*=\s*['"]10\.28\.0['"]/,
    required: true
  },
  {
    name: "Header search paths configuration",
    pattern: /HEADER_SEARCH_PATHS/,
    required: true
  },
  {
    name: "C++20 language standard",
    pattern: /CLANG_CXX_LANGUAGE_STANDARD.*c\+\+20/,
    required: true
  },
  {
    name: "User script sandboxing disabled",
    pattern: /ENABLE_USER_SCRIPT_SANDBOXING.*NO/,
    required: true
  }
]

all_passed = true

validations.each do |validation|
  if podfile_content.match(validation[:pattern])
    puts "✅ #{validation[:name]}"
  else
    if validation[:required]
      puts "❌ #{validation[:name]} - MISSING (Required)"
      all_passed = false
    else
      puts "⚠️  #{validation[:name]} - MISSING (Optional)"
    end
  end
end

# Additional checks
puts "\n🔍 Additional validation checks..."

# Check for deprecated patterns
deprecated_patterns = [
  {
    name: "Hardcoded iOS deployment target",
    pattern: /platform\s+:ios,\s*['"][0-9]+\.[0-9]+['"]/,
    message: "Use min_ios_version_supported instead"
  },
  {
    name: "Unconditional Flipper usage",
    pattern: /FlipperConfiguration\.enabled(?!\()/,
    message: "Use conditional FlipperConfiguration"
  }
]

deprecated_patterns.each do |pattern|
  if podfile_content.match(pattern[:pattern])
    puts "⚠️  Deprecated pattern found: #{pattern[:name]} - #{pattern[:message]}"
  end
end

# Try to parse the Podfile
begin
  puts "\n🔍 Parsing Podfile syntax..."
  
  # Create a temporary Podfile parser
  podfile = Pod::Podfile.from_file('Podfile')
  puts "✅ Podfile syntax is valid"
  
  # Check platform
  platform = podfile.target_definitions['Pods'].platform
  if platform && platform.name == :ios
    puts "✅ iOS platform configured"
  else
    puts "❌ iOS platform not properly configured"
    all_passed = false
  end
  
rescue => e
  puts "❌ Podfile syntax error: #{e.message}"
  all_passed = false
end

puts "\n" + "="*50

if all_passed
  puts "🎉 Podfile validation PASSED!"
  puts "✅ Configuration is compatible with React Native 0.75.4"
  exit 0
else
  puts "❌ Podfile validation FAILED!"
  puts "Please fix the issues above before proceeding"
  exit 1
end