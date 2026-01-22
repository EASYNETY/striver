from PIL import Image

def remove_background(image_path, output_path):
    img = Image.open(image_path).convert("RGBA")
    datas = img.getdata()

    newData = []
    cutOff = 240 

    for item in datas:
        if item[0] > 100 and item[1] > 200 and item[2] > 150:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")

if __name__ == "__main__":
    remove_background("assets/images/icon.png", "assets/images/icon_transparent.png")
