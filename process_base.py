import os
from rembg import remove
from PIL import Image

def process_base():
    in_path = "/Users/hurakacha/.gemini/antigravity/brain/cfcbdfc1-9d68-4588-ac7e-d42a9a975cca/base_vault_rawcallback_1772200274608.png"
    out_path = "/Users/hurakacha/Files From d.localized/scripts/towerdefense/assets/images/base.png"
    
    if not os.path.exists(in_path):
        print(f"Input file not found: {in_path}")
        return

    try:
        with open(in_path, "rb") as i:
            input_data = i.read()
            output_data = remove(input_data)
        
        # Save and also resize to be slightly larger than tile (e.g. 64x64 or 80x80)
        img = Image.open(io.BytesIO(output_data))
        img = img.resize((80, 80), Image.Resampling.LANCZOS)
        img.save(out_path)
            
        print(f"Successfully processed base sprite: {out_path}")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    import io
    process_base()
