from PIL import Image
import os

def resize_image_ios(image_path, output_dir, sizes):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    for size, name in sizes.items():
        try:
            img = Image.open(image_path)
            img = img.resize((size, size), Image.Resampling.LANCZOS)
            img.save(os.path.join(output_dir, name))
        except Exception as e:
            print(f"Error resizing image for size {size}: {e}")

if __name__ == "__main__":
    sizes = {
        1024: "AppIcon-1024.png",
        40: "AppIcon-20-20-@2x.png",
        60: "AppIcon-20-20-@3x.png",
        58: "AppIcon-29-29-@2x.png",
        87: "AppIcon-29-29-@3x.png",
        80: "AppIcon-40-40-@2x.png",
        120: "AppIcon-40-40-@3x.png",
        180: "AppIcon-60-60-@3x.png",
    }
    resize_image_ios("assets/images/icon_transparent.png", "ios/StriverApp/Images.xcassets/AppIcon.appiconset", sizes)
