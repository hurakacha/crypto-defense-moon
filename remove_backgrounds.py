import os
from rembg import remove
from PIL import Image
import io

def process_enemies():
    enemy_dir = "/Users/hurakacha/Files From d.localized/scripts/towerdefense/assets/images/enemies/"
    
    if not os.path.exists(enemy_dir):
        print(f"Directory not found: {enemy_dir}")
        return

    files = [f for f in os.listdir(enemy_dir) if f.endswith('.png')]
    print(f"Found {len(files)} sprites to process in {enemy_dir}")

    for filename in files:
        file_path = os.path.join(enemy_dir, filename)
        
        try:
            with open(file_path, "rb") as i:
                input_data = i.read()
                output_data = remove(input_data)
            
            with open(file_path, "wb") as o:
                o.write(output_data)
                
            print(f"Successfully removed background from: {filename}")
        except Exception as e:
            print(f"Error processing {filename}: {str(e)}")

if __name__ == "__main__":
    process_enemies()
