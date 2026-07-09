from PIL import Image

def remove_bg(img_path, out_path):
    img = Image.open(img_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        # Check if the pixel is near black (threshold)
        # item is (r, g, b, a)
        avg = (item[0] + item[1] + item[2]) / 3
        if avg < 30:
            # make it transparent but keep the color for blending
            new_data.append((item[0], item[1], item[2], 0))
        else:
            # apply alpha tapering so edges aren't harsh
            alpha = min(255, int((avg - 30) * 1.5))
            new_data.append((item[0], item[1], item[2], alpha))
            
    img.putdata(new_data)
    img.save(out_path, "PNG")

remove_bg("assets/images/flower-hero.png", "assets/images/flower-transparent.png")
