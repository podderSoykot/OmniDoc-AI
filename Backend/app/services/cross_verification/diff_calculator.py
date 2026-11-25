from typing import Any, Tuple
import difflib

class DiffCalculator:
    @staticmethod
    def calculate_string_similarity(a: str, b: str) -> float:
        """Computes ratio between two strings (0.0 to 1.0)."""
        if not a or not b:
            return 0.0
        return difflib.SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()

    @staticmethod
    def compare_numeric(
        val_a: Any, 
        val_b: Any, 
        tolerance: float = 0.05
    ) -> Tuple[bool, float]:
        """
        Compares two numeric values within a tolerance.
        Returns: (is_match, absolute_diff)
        """
        try:
            a = float(val_a)
            b = float(val_b)
            diff = abs(a - b)
            return diff <= tolerance, round(diff, 2)
        except (ValueError, TypeError):
            return False, 999999.0
