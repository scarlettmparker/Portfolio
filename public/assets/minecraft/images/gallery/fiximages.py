from PIL import Image
import os

def create_directories(base_dir):
    for folder in ['small', 'medium', 'large']:
        directory = os.path.join(base_dir, folder)
        if not os.path.exists(directory):
            os.makedirs(directory)

def resize_images(input_dir):
    for root, dirs, files in os.walk(input_dir):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
                filename = os.path.join(root, file)
                with Image.open(filename) as img:
                    original_width, original_height = img.size
                    
                    sizes = {
                        'small': (540, 300),
                        'medium': (1024, 576),
                        'large': (1842, 1036)
                    }
                    
                    for size_name, size_tuple in sizes.items():
                        if original_width > size_tuple[0] or original_height > size_tuple[1]:
                            output_dir = os.path.join(input_dir, size_name)
                            output_filename = os.path.join(output_dir, file)
                            
                            # Resize only if necessary
                            if img.size > size_tuple:
                                img_resized = img.resize(size_tuple)
                                img_resized.save(output_filename, optimize=True)
                            else:
                                img.save(output_filename)

def main():
    current_dir = os.path.dirname(__file__)
    input_dir = current_dir
    create_directories(input_dir)
    resize_images(input_dir)
    print("Images resized and saved to respective folders in:", input_dir)

if __name__ == "__main__":
    main()