import unittest
from pathlib import Path
from src.midi_processor import MidiProcessor

class TestMidiProcessor(unittest.TestCase):
    def setUp(self):
        """Set up test fixtures before each test method."""
        self.processor = MidiProcessor()
        self.test_data_dir = Path("tests/data")
        
    def test_electronic_track(self):
        """Test processing of electronic track."""
        features = self.processor.extract_features(self.test_data_dir / "electronic.mid")
        
        # Check basic features
        self.assertIn("tempo", features)
        self.assertIn("time_signature", features)
        self.assertIn("instruments", features)
        
        # Check instrument detection
        instruments = [inst["name"] for inst in features["instruments"]]
        self.assertIn("Square Lead", instruments)
        self.assertIn("Synth Drum", instruments)
        
        # Check note features
        self.assertIn("note_features", features)
        self.assertIn("velocity_mean", features["note_features"])
        self.assertIn("velocity_std", features["note_features"])
        
        # Check harmony features
        harmony = self.processor.extract_harmony(features)
        self.assertIn("key_signature", harmony)
        self.assertIn("chords", harmony)
        
        # Check rhythm features
        rhythm = self.processor.extract_rhythm(features)
        self.assertIn("beat_positions", rhythm)
        self.assertIn("tempo", rhythm)
        
        # Check genre and mood
        genre_mood = self.processor.estimate_genre_and_mood(features)
        self.assertIn("genre", genre_mood)
        self.assertIn("mood", genre_mood)
        
    def test_classical_piece(self):
        """Test processing of classical piece."""
        features = self.processor.extract_features(self.test_data_dir / "classical.mid")
        
        # Check basic features
        self.assertIn("tempo", features)
        self.assertIn("time_signature", features)
        self.assertIn("instruments", features)
        
        # Check instrument detection
        instruments = [inst["name"] for inst in features["instruments"]]
        self.assertIn("Acoustic Grand Piano", instruments)
        self.assertIn("String Ensemble", instruments)
        
        # Check note features
        self.assertIn("note_features", features)
        self.assertIn("velocity_mean", features["note_features"])
        self.assertIn("velocity_std", features["note_features"])
        
        # Check harmony features
        harmony = self.processor.extract_harmony(features)
        self.assertIn("key_signature", harmony)
        self.assertIn("chords", harmony)
        
        # Check rhythm features
        rhythm = self.processor.extract_rhythm(features)
        self.assertIn("beat_positions", rhythm)
        self.assertIn("tempo", rhythm)
        
        # Check genre and mood
        genre_mood = self.processor.estimate_genre_and_mood(features)
        self.assertIn("genre", genre_mood)
        self.assertIn("mood", genre_mood)
        
    def test_rock_song(self):
        """Test processing of rock song."""
        features = self.processor.extract_features(self.test_data_dir / "rock.mid")
        
        # Check basic features
        self.assertIn("tempo", features)
        self.assertIn("time_signature", features)
        self.assertIn("instruments", features)
        
        # Check instrument detection
        instruments = [inst["name"] for inst in features["instruments"]]
        self.assertIn("Distortion Guitar", instruments)
        self.assertIn("Electric Bass", instruments)
        self.assertIn("Synth Drum", instruments)
        
        # Check note features
        self.assertIn("note_features", features)
        self.assertIn("velocity_mean", features["note_features"])
        self.assertIn("velocity_std", features["note_features"])
        
        # Check harmony features
        harmony = self.processor.extract_harmony(features)
        self.assertIn("key_signature", harmony)
        self.assertIn("chords", harmony)
        
        # Check rhythm features
        rhythm = self.processor.extract_rhythm(features)
        self.assertIn("beat_positions", rhythm)
        self.assertIn("tempo", rhythm)
        
        # Check genre and mood
        genre_mood = self.processor.estimate_genre_and_mood(features)
        self.assertIn("genre", genre_mood)
        self.assertIn("mood", genre_mood)
        
    def test_jazz_improvisation(self):
        """Test processing of jazz improvisation."""
        features = self.processor.extract_features(self.test_data_dir / "jazz.mid")
        
        # Check basic features
        self.assertIn("tempo", features)
        self.assertIn("time_signature", features)
        self.assertIn("instruments", features)
        
        # Check instrument detection
        instruments = [inst["name"] for inst in features["instruments"]]
        self.assertIn("Acoustic Grand Piano", instruments)
        self.assertIn("Acoustic Bass", instruments)
        
        # Check note features
        self.assertIn("note_features", features)
        self.assertIn("velocity_mean", features["note_features"])
        self.assertIn("velocity_std", features["note_features"])
        
        # Check harmony features
        harmony = self.processor.extract_harmony(features)
        self.assertIn("key_signature", harmony)
        self.assertIn("chords", harmony)
        
        # Check rhythm features
        rhythm = self.processor.extract_rhythm(features)
        self.assertIn("beat_positions", rhythm)
        self.assertIn("tempo", rhythm)
        
        # Check genre and mood
        genre_mood = self.processor.estimate_genre_and_mood(features)
        self.assertIn("genre", genre_mood)
        self.assertIn("mood", genre_mood)
        
    def test_simple_melody(self):
        """Test processing of simple melody."""
        features = self.processor.extract_features(self.test_data_dir / "simple.mid")
        
        # Check basic features
        self.assertIn("tempo", features)
        self.assertIn("time_signature", features)
        self.assertIn("instruments", features)
        
        # Check instrument detection
        instruments = [inst["name"] for inst in features["instruments"]]
        self.assertIn("Acoustic Grand Piano", instruments)
        
        # Check note features
        self.assertIn("note_features", features)
        self.assertIn("velocity_mean", features["note_features"])
        self.assertIn("velocity_std", features["note_features"])
        
        # Check harmony features
        harmony = self.processor.extract_harmony(features)
        self.assertIn("key_signature", harmony)
        self.assertIn("chords", harmony)
        
        # Check rhythm features
        rhythm = self.processor.extract_rhythm(features)
        self.assertIn("beat_positions", rhythm)
        self.assertIn("tempo", rhythm)
        
        # Check genre and mood
        genre_mood = self.processor.estimate_genre_and_mood(features)
        self.assertIn("genre", genre_mood)
        self.assertIn("mood", genre_mood)
        
    def test_prompt_generation(self):
        """Test prompt generation for all test files."""
        test_files = [
            "electronic.mid",
            "classical.mid",
            "rock.mid",
            "jazz.mid",
            "simple.mid"
        ]
        
        for file in test_files:
            features = self.processor.extract_features(self.test_data_dir / file)
            prompt = self.processor.generate_prompt(features)
            
            # Check prompt structure
            self.assertIsInstance(prompt, str)
            self.assertGreater(len(prompt), 0)
            
            # Check prompt content
            self.assertIn("genre", prompt.lower())
            self.assertIn("mood", prompt.lower())
            self.assertIn("instruments", prompt.lower())
            
if __name__ == "__main__":
    unittest.main() 