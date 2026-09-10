import unittest
from server import analyze_speech_content, CATEGORIES, EXACT_REPLACEMENTS

class TestEmotionEngine(unittest.TestCase):
    def test_intellectual_belittling(self):
        # 用户明确提出的典型负面样例 1: "怎么这么笨"
        result1 = analyze_speech_content("你怎么这么笨，这道题我都讲过好多次了", 65.0)
        self.assertTrue(result1["has_negative"])
        self.assertIn("怎么这么笨", result1["matched_phrases"])
        self.assertTrue("拆" in result1["replacement_suggestion"] or "步骤" in result1["replacement_suggestion"])

        # 用户明确提出的典型负面样例 2: "蠢的更猪一样"
        result2 = analyze_speech_content("蠢的更猪一样，这都不会", 70.0)
        self.assertTrue(result2["has_negative"])
        self.assertTrue(any("蠢" in p for p in result2["matched_phrases"]))
        self.assertEqual(result2["category"], "intellectual_belittling")

    def test_toxic_comparison(self):
        # 用户明确提出的典型负面样例 3: "谁都比你强"
        result = analyze_speech_content("谁都比你强，你看看别人家的小孩", 75.0)
        self.assertTrue(result["has_negative"])
        self.assertIn("谁都比你强", result["matched_phrases"])
        self.assertEqual(result["category"], "toxic_comparison")
        self.assertTrue("更棒" in result["replacement_suggestion"] or "进步" in result["replacement_suggestion"])

    def test_positive_speech(self):
        # 正面鼓励言语
        result = analyze_speech_content("做得很棒，先深呼吸，我们一步一步慢慢来", 45.0)
        self.assertFalse(result["has_negative"])
        self.assertEqual(result["level"], "green")
        self.assertLess(result["score"], 40)

    def test_multimodal_db_fusion(self):
        # 分贝很高时结合语言打高分
        loud_result = analyze_speech_content("快点写！", 88.0)
        self.assertEqual(loud_result["level"], "red")
        self.assertGreaterEqual(loud_result["score"], 65)

if __name__ == "__main__":
    unittest.main()

