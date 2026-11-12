with open('src/components/screens/HomeScreen.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

import_target = "import { IsometricTile } from '../common/IsometricTile';"
import_replacement = """import { IsometricTile } from '../common/IsometricTile';
import { GoogleReviewsSection } from '../common/GoogleReviewsSection';"""
text = text.replace(import_target, import_replacement, 1)

section_target = "      {/* 5. One-Tap Support Bar with Specular Platforms & Zoom-In Pulse */}"
section_replacement = """      {/* 5. Google Customer Reviews & Ratings Carousel */}
      <GoogleReviewsSection />

      {/* 6. One-Tap Support Bar with Specular Platforms & Zoom-In Pulse */}"""
text = text.replace(section_target, section_replacement, 1)

with open('src/components/screens/HomeScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("HomeScreen.tsx updated successfully!")

