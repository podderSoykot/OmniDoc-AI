import cv2
import numpy as np
from PIL import Image

class ImagePreprocessor:
    @staticmethod
    def preprocess_image(image_input) -> np.ndarray:
        """
        Applies deskewing, grayscale conversion, noise reduction,
        and adaptive thresholding to optimize OCR accuracy.
        Accepts PIL Image, file path str, or numpy array.
        """
        if isinstance(image_input, Image.Image):
            img = cv2.cvtColor(np.array(image_input), cv2.COLOR_RGB2BGR)
        elif isinstance(image_input, str):
            img = cv2.imread(image_input)
            if img is None:
                raise ValueError(f"Failed to read image from path: {image_input}")
        elif isinstance(image_input, np.ndarray):
            img = image_input.copy()
        else:
            raise TypeError("Unsupported image input type")

        # 1. Grayscale
        if len(img.shape) == 3:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        else:
            gray = img

        # 2. Resize if image is too small for OCR (< 1000px width)
        h, w = gray.shape
        if w < 1000:
            scale = 1000.0 / w
            gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

        # 3. Denoise with bilateral filter to preserve text edges
        denoised = cv2.bilateralFilter(gray, 9, 75, 75)

        # 4. Otsu's thresholding for crisp black/white text separation
        _, binary = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # 5. Deskewing
        deskewed = ImagePreprocessor._deskew(binary)
        return deskewed

    @staticmethod
    def _deskew(image: np.ndarray) -> np.ndarray:
        """Corrects image tilt/skew angle."""
        coords = np.column_stack(np.where(image == 0))
        if len(coords) < 50:
            return image
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        elif angle > 45:
            angle = 90 - angle
        else:
            angle = -angle

        if abs(angle) < 0.5 or abs(angle) > 30:
            return image

        (h, w) = image.shape[:2]
        center = (w // 2, h // 2)
        matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(image, matrix, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        return rotated
