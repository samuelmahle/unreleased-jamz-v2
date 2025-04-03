import unittest
from src.prompt_generator import PromptGenerator

class TestPromptGenerator(unittest.TestCase):
    def setUp(self):
        """Set up test fixtures."""
        self.generator = PromptGenerator()
        
    def test_get_tempo_descriptor(self):
        """Test tempo to descriptor conversion."""
        test_cases = [
            (30, 'very_slow'),
            (75, 'slow'),
            (100, 'moderate'),
            (140, 'fast'),
            (180, 'very_fast')
        ]
        
        for bpm, expected in test_cases:
            with self.subTest(bpm=bpm):
                result = self.generator.get_tempo_descriptor(bpm)
                self.assertEqual(result, expected)
                
    def test_get_mood_from_features(self):
        """Test mood detection from features."""
        test_cases = [
            (130, {}, 'energetic'),
            (80, {}, 'calm'),
            (100, {}, 'upbeat')
        ]
        
        for tempo, harmony, expected in test_cases:
            with self.subTest(tempo=tempo):
                result = self.generator.get_mood_from_features(tempo, harmony)
                self.assertEqual(result, expected)
                
    def test_generate_prompt(self):
        """Test prompt generation from features."""
        features = {
            'genre': 'electronic',
            'instruments': ['synthesizer'],
            'tempo': 120.0,
            'key': 'C major',
            'time_signature': (4, 4)
        }
        
        # Test with default template
        prompt = self.generator.generate_prompt(features)
        self.assertIsInstance(prompt, str)
        self.assertIn('electronic', prompt)
        self.assertIn('synthesizer', prompt)
        self.assertIn('C major', prompt)
        self.assertIn('4/4', prompt)
        
        # Test with custom template
        template = "Create a {genre} song using {instruments}"
        prompt = self.generator.generate_prompt(features, template)
        self.assertIn('electronic', prompt)
        self.assertIn('synthesizer', prompt)
        
    def test_generate_variations(self):
        """Test prompt variation generation."""
        base_prompt = "Create an electronic track"
        variations = self.generator.generate_variations(base_prompt, n_variations=3)
        
        self.assertEqual(len(variations), 3)
        self.assertEqual(variations[0], base_prompt)
        
        # Check that all variations are different
        self.assertEqual(len(set(variations)), 3)
        
        # Check that all variations start with the base prompt
        for var in variations:
            self.assertTrue(var.startswith(base_prompt))
            
    def test_empty_features(self):
        """Test prompt generation with empty features."""
        features = {}
        prompt = self.generator.generate_prompt(features)
        
        # Should use default values
        self.assertIn('electronic', prompt)
        self.assertIn('synthesizer', prompt)
        
    def test_multiple_instruments(self):
        """Test prompt generation with multiple instruments."""
        features = {
            'genre': 'rock',
            'instruments': ['electric guitar', 'drums', 'bass'],
            'tempo': 120.0
        }
        
        prompt = self.generator.generate_prompt(features)
        self.assertIn('electric guitar and drums', prompt)

if __name__ == '__main__':
    unittest.main() 