from PIL import Image
import os

artifacts_dir = "/Users/hurakacha/.gemini/antigravity/brain/cfcbdfc1-9d68-4588-ac7e-d42a9a975cca"
out_dir = "/Users/hurakacha/Files From d.localized/scripts/towerdefense/assets/images/towers"

os.makedirs(out_dir, exist_ok=True)

# Find the latest generated image for each prefix
files = os.listdir(artifacts_dir)
prefixes = ['tower_hodl', 'tower_laser', 'tower_cannon', 'tower_drone', 'tower_burner', 'tower_gallery', 'tower_shield']

for prefix in prefixes:
    matching_files = [f for f in files if f.startswith(prefix) and f.endswith('.png')]
    if not matching_files:
        print(f"Skipping {prefix}, no files found.")
        continue
    
    # Get the most recently modified one just in case
    matching_files.sort(key=lambda x: os.path.getmtime(os.path.join(artifacts_dir, x)), reverse=True)
    latest_file = matching_files[0]
    
    in_path = os.path.join(artifacts_dir, latest_file)
    out_path = os.path.join(out_dir, f"{prefix}.png")
    
    img = Image.open(in_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    # simple flood-fill style or threshold for pure white (or very close)
    for item in data:
        # Check if white-ish (high RGB values)
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0)) # transparent
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    
    # Resize to standard tower size, a bit larger than tile size, say 64x64 or 80x80 so it overflows slightly
    img = img.resize((64, 64), Image.Resampling.LANCZOS)
    img.save(out_path)
    print(f"Processed {latest_file} -> {out_path}")

print("Done processing sprites.")
