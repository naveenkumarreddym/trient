#!/usr/bin/env python3
"""
Simple script to create placeholder icons for the Browser-Use Chrome Extension.
Requires Pillow: pip install Pillow
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os
except ImportError:
    print("Error: Pillow is not installed. Install it with: pip install Pillow")
    exit(1)


def create_icon(size, filename):
    """Create a simple icon with a robot emoji or gradient"""
    # Create image with gradient background
    img = Image.new('RGB', (size, size), color='white')
    draw = ImageDraw.Draw(img)
    
    # Create gradient background (purple to blue)
    for y in range(size):
        r = int(102 + (118 - 102) * y / size)
        g = int(126 + (75 - 126) * y / size)
        b = int(234 + (162 - 234) * y / size)
        draw.rectangle([(0, y), (size, y + 1)], fill=(r, g, b))
    
    # Draw a simple robot face
    # Head outline
    head_margin = size // 6
    draw.ellipse(
        [(head_margin, head_margin), (size - head_margin, size - head_margin)],
        fill='white',
        outline='white',
        width=2
    )
    
    # Eyes
    eye_size = size // 10
    eye_y = size // 3
    left_eye_x = size // 3
    right_eye_x = 2 * size // 3
    
    draw.ellipse(
        [(left_eye_x - eye_size, eye_y - eye_size), 
         (left_eye_x + eye_size, eye_y + eye_size)],
        fill='#667eea'
    )
    draw.ellipse(
        [(right_eye_x - eye_size, eye_y - eye_size), 
         (right_eye_x + eye_size, eye_y + eye_size)],
        fill='#667eea'
    )
    
    # Smile
    mouth_y = 2 * size // 3
    mouth_width = size // 3
    draw.arc(
        [(size // 2 - mouth_width, mouth_y - mouth_width // 2),
         (size // 2 + mouth_width, mouth_y + mouth_width // 2)],
        start=0,
        end=180,
        fill='#667eea',
        width=size // 20
    )
    
    # Save the image
    os.makedirs('icons', exist_ok=True)
    img.save(f'icons/{filename}')
    print(f"Created icons/{filename} ({size}x{size})")


def main():
    """Create all required icon sizes"""
    print("Creating Browser-Use Chrome Extension Icons...")
    print("-" * 50)
    
    # Create icons in different sizes
    create_icon(16, 'icon16.png')
    create_icon(48, 'icon48.png')
    create_icon(128, 'icon128.png')
    
    print("-" * 50)
    print("✓ All icons created successfully!")
    print("\nYou can now load the extension in Chrome:")
    print("1. Go to chrome://extensions/")
    print("2. Enable 'Developer mode'")
    print("3. Click 'Load unpacked'")
    print("4. Select the chrome-plugin folder")


if __name__ == '__main__':
    main()
