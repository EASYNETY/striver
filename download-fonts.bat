@echo off
echo Downloading Oswald fonts...
curl -L "https://github.com/google/fonts/raw/main/ofl/oswald/Oswald-Regular.ttf" -o "assets/fonts/Oswald-Regular.ttf"
curl -L "https://github.com/google/fonts/raw/main/ofl/oswald/Oswald-Medium.ttf" -o "assets/fonts/Oswald-Medium.ttf"
curl -L "https://github.com/google/fonts/raw/main/ofl/oswald/Oswald-SemiBold.ttf" -o "assets/fonts/Oswald-SemiBold.ttf"
curl -L "https://github.com/google/fonts/raw/main/ofl/oswald/Oswald-Bold.ttf" -o "assets/fonts/Oswald-Bold.ttf"

echo Downloading Noto Sans fonts...
curl -L "https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans-Regular.ttf" -o "assets/fonts/NotoSans-Regular.ttf"
curl -L "https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans-Medium.ttf" -o "assets/fonts/NotoSans-Medium.ttf"
curl -L "https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans-SemiBold.ttf" -o "assets/fonts/NotoSans-SemiBold.ttf"
curl -L "https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans-Bold.ttf" -o "assets/fonts/NotoSans-Bold.ttf"
curl -L "https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans-Light.ttf" -o "assets/fonts/NotoSans-Light.ttf"

echo Done! Fonts downloaded to assets/fonts/
pause
