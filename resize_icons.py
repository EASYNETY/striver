from PIL import Image
import os

def resize_image(image_path, output_dir, sizes):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    for size, name in sizes.items():
        try:
            img = Image.open(image_path)
            img = img.resize((size, size), Image.Resampling.LANCZOS)
            
            # Create mipmap directory if it doesn't exist
            mipmap_dir = os.path.join(output_dir, f"mipmap-{name}")
            if not os.path.exists(mipmap_dir):
                os.makedirs(mipmap_dir)
                
            img.save(os.path.join(mipmap_dir, "ic_launcher.png"))
            img.save(os.path.join(mipmap_dir, "ic_launcher_round.png"))
        except Exception as e:
            print(f"Error resizing image for size {size}: {e}")

if __name__ == "__main__":
    sizes = {
        48: "mdpi",
        72: "hdpi",
        96: "xhdpi",
        144: "xxhdpi",
        192: "xxxhdpi"
    }
    resize_image("assets/images/icon_transparent.png", "android/app/src/main/res", sizes)
