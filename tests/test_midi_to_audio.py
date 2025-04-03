import unittest
from pathlib import Path
import numpy as np
import torch
from src.midi_to_audio import MidiToAudioGenerator

class TestMidiToAudioGenerator(unittest.TestCase):
    def setUp(self):
        """Set up test fixtures."""
        self.generator = MidiToAudioGenerator()
        self.test_midi_path = Path("data/test.mid")
        self.test_output_path = Path("data/test_output.wav")
        
    def tearDown(self):
        """Clean up test files."""
        if self.test_output_path.exists():
            self.test_output_path.unlink()
            
    def test_initialization(self):
        """Test model initialization."""
        self.assertIsNotNone(self.generator.model)
        self.assertIsInstance(self.generator.device, torch.device)
        
    def test_process_midi(self):
        """Test MIDI processing."""
        features = self.generator.process_midi(self.test_midi_path)
        self.assertIsInstance(features, dict)
        
    def test_generate_audio(self):
        """Test audio generation."""
        prompt = "Create an electronic track with synthesizer"
        wav = self.generator.generate_audio(prompt, duration=5)
        
        # Check output shape and type
        self.assertIsInstance(wav, np.ndarray)
        self.assertEqual(len(wav.shape), 3)  # (batch, channels, samples)
        
        # Check if duration is approximately correct (32000 samples per second)
        expected_samples = 5 * 32000
        self.assertAlmostEqual(wav.shape[2], expected_samples, delta=32000)
        
    def test_midi_to_audio_pipeline(self):
        """Test complete MIDI to audio pipeline."""
        # TODO: Add test with actual MIDI file
        self.generator.midi_to_audio(
            self.test_midi_path,
            self.test_output_path
        )
        
        # Check if output file was created
        self.assertTrue(self.test_output_path.exists())
        
    def test_invalid_input(self):
        """Test handling of invalid inputs."""
        # Test with non-existent MIDI file
        with self.assertRaises(FileNotFoundError):
            self.generator.midi_to_audio(
                "nonexistent.mid",
                self.test_output_path
            )
            
        # Test with invalid prompt
        with self.assertRaises(ValueError):
            self.generator.generate_audio("")
            
    def test_custom_duration(self):
        """Test audio generation with custom duration."""
        durations = [5, 10, 15]
        
        for duration in durations:
            with self.subTest(duration=duration):
                wav = self.generator.generate_audio(
                    "Test prompt",
                    duration=duration
                )
                expected_samples = duration * 32000
                self.assertAlmostEqual(
                    wav.shape[2],
                    expected_samples,
                    delta=32000
                )
                
    def test_multiple_samples(self):
        """Test generating multiple audio samples."""
        num_samples = 3
        wav = self.generator.generate_audio(
            "Test prompt",
            duration=5,
            num_samples=num_samples
        )
        
        self.assertEqual(wav.shape[0], num_samples)

if __name__ == '__main__':
    unittest.main() 