import pretty_midi
import numpy as np
from pathlib import Path
import logging
from typing import Dict, List, Tuple, Optional

logger = logging.getLogger(__name__)

class MidiProcessor:
    def __init__(self, quantize_step: float = 0.05):
        """Initialize the MIDI processor.
        
        Args:
            quantize_step (float): Time quantization step in seconds (default: 0.05 = 50ms)
        """
        self.quantize_step = quantize_step
        
        # MIDI program number to instrument name mapping
        self.instrument_map = {
            0: 'piano',
            32: 'acoustic bass',
            33: 'electric bass',
            48: 'timpani',
            56: 'trumpet',
            80: 'square lead',
            81: 'sawtooth lead',
            128: 'synth drum'
        }
        
        # MIDI pitch to note name mapping (C4 = 60)
        self.pitch_to_note = {
            60: 'C4', 61: 'C#4', 62: 'D4', 63: 'D#4', 64: 'E4',
            65: 'F4', 66: 'F#4', 67: 'G4', 68: 'G#4', 69: 'A4',
            70: 'A#4', 71: 'B4', 72: 'C5'
        }

    def extract_features(self, midi_path: str) -> Dict:
        """Extract musical features from a MIDI file.
        
        Args:
            midi_path (str): Path to the MIDI file
            
        Returns:
            dict: Dictionary containing extracted features:
                - tempo (float): Base tempo in BPM
                - key (str): Estimated key signature
                - time_signature (tuple): Time signature as (numerator, denominator)
                - notes (list): List of note events with timing, pitch, velocity
                - instruments (list): List of instruments used
        """
        midi_path = Path(midi_path)
        if not midi_path.exists():
            raise FileNotFoundError(f"MIDI file not found: {midi_path}")
            
        logger.info(f"Extracting features from {midi_path}")
        
        # Load MIDI file
        midi = pretty_midi.PrettyMIDI(str(midi_path))
        
        # Extract global metadata
        tempo = midi.get_tempo_changes()[1][0]  # Get first tempo
        time_signature = midi.time_signature_changes[0] if midi.time_signature_changes else (4, 4)
        
        # Extract notes and instruments
        notes = []
        instruments = set()
        
        for instrument in midi.instruments:
            instrument_name = self.instrument_map.get(instrument.program, f'instrument_{instrument.program}')
            instruments.add(instrument_name)
            
            for note in instrument.notes:
                # Quantize note timing
                start_time = round(note.start / self.quantize_step) * self.quantize_step
                end_time = round(note.end / self.quantize_step) * self.quantize_step
                
                # Normalize velocity (0-1)
                velocity = note.velocity / 127.0
                
                notes.append({
                    'pitch': note.pitch,
                    'start_time': start_time,
                    'end_time': end_time,
                    'velocity': velocity,
                    'instrument': instrument_name
                })
        
        # Sort notes by start time
        notes.sort(key=lambda x: x['start_time'])
        
        # Estimate key signature
        key = self._estimate_key(notes)
        
        features = {
            'tempo': tempo,
            'key': key,
            'time_signature': time_signature,
            'notes': notes,
            'instruments': list(instruments)
        }
        
        return features
        
    def get_note_sequence(self, midi_path: str) -> List[Dict]:
        """Extract note sequence from MIDI file.
        
        Args:
            midi_path (str): Path to MIDI file
            
        Returns:
            list: List of note events, each containing:
                - start_time (float): Start time in seconds
                - end_time (float): End time in seconds
                - pitch (int): MIDI pitch number
                - velocity (int): Note velocity (0-127)
                - instrument (int): MIDI program number
        """
        features = self.extract_features(midi_path)
        return features['notes']
        
    def analyze_harmony(self, notes: List[Dict]) -> Dict:
        """Analyze harmonic content of note sequence.
        
        Args:
            notes (list): List of note events
            
        Returns:
            dict: Harmonic analysis including:
                - key (str): Estimated key
                - chord_progression (list): List of chord symbols
                - scale (list): Scale degrees used
        """
        # Group notes by time to find chords
        time_groups = {}
        for note in notes:
            time = note['start_time']
            if time not in time_groups:
                time_groups[time] = []
            time_groups[time].append(note['pitch'])
            
        # Analyze each time group for chords
        chord_progression = []
        for time, pitches in sorted(time_groups.items()):
            if len(pitches) >= 3:  # Only consider groups with 3 or more notes as chords
                chord = self._identify_chord(pitches)
                if chord:
                    chord_progression.append(chord)
                    
        # Get scale degrees used
        scale_degrees = self._get_scale_degrees(notes)
        
        return {
            'key': self._estimate_key(notes),
            'chord_progression': chord_progression,
            'scale': scale_degrees
        }
        
    def analyze_rhythm(self, notes: List[Dict]) -> Dict:
        """Analyze rhythmic content of note sequence.
        
        Args:
            notes (list): List of note events
            
        Returns:
            dict: Rhythmic analysis including:
                - tempo (float): Estimated tempo in BPM
                - meter (tuple): Time signature as (numerator, denominator)
                - beat_positions (list): List of beat positions
        """
        if not notes:
            return {
                'tempo': 120.0,
                'meter': (4, 4),
                'beat_positions': []
            }
            
        # Find beat positions by looking at note onsets
        onset_times = [note['start_time'] for note in notes]
        beat_positions = self._find_beat_positions(onset_times)
        
        # Estimate tempo from beat positions
        if len(beat_positions) >= 2:
            intervals = np.diff(beat_positions)
            tempo = 60 / np.median(intervals)
        else:
            tempo = 120.0
            
        return {
            'tempo': tempo,
            'meter': (4, 4),  # Default to 4/4
            'beat_positions': beat_positions
        }
        
    def get_prompt_features(self, midi_path: str) -> Dict:
        """Extract features specifically for generating AudioGen prompts.
        
        Args:
            midi_path (str): Path to MIDI file
            
        Returns:
            dict: Features formatted for prompt generation:
                - genre (str): Estimated musical genre
                - instruments (list): Main instruments used
                - tempo (str): Tempo description (e.g. "moderate", "fast")
                - mood (str): Estimated mood/character
        """
        features = self.extract_features(midi_path)
        harmony = self.analyze_harmony(features['notes'])
        rhythm = self.analyze_rhythm(features['notes'])
        
        # Estimate genre based on instruments and musical characteristics
        genre = self._estimate_genre(features['instruments'], harmony, rhythm)
        
        # Estimate mood based on tempo, harmony, and note density
        mood = self._estimate_mood(rhythm['tempo'], harmony, features['notes'])
        
        prompt_features = {
            'genre': genre,
            'instruments': features['instruments'],
            'tempo': rhythm['tempo'],
            'mood': mood
        }
        
        return prompt_features
        
    def _estimate_key(self, notes: List[Dict]) -> str:
        """Estimate the key signature from note pitches."""
        if not notes:
            return 'C major'
            
        # Count pitch classes (C=0, C#=1, etc.)
        pitch_counts = np.zeros(12)
        for note in notes:
            pitch_counts[note['pitch'] % 12] += 1
            
        # Find the most common pitch class
        key_pitch = np.argmax(pitch_counts)
        
        # Map pitch class to key name
        key_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        return f"{key_names[key_pitch]} major"
        
    def _identify_chord(self, pitches: List[int]) -> Optional[str]:
        """Identify a chord from a list of pitches."""
        if len(pitches) < 3:
            return None
            
        # Convert to pitch classes
        pitch_classes = [p % 12 for p in pitches]
        pitch_classes.sort()
        
        # Basic chord identification
        intervals = np.diff(pitch_classes)
        
        # Major triad
        if np.array_equal(intervals, [4, 3]):
            root = self.pitch_to_note.get(pitches[0], f"Pitch{pitches[0]}")
            return f"{root} major"
            
        # Minor triad
        if np.array_equal(intervals, [3, 4]):
            root = self.pitch_to_note.get(pitches[0], f"Pitch{pitches[0]}")
            return f"{root} minor"
            
        return None
        
    def _get_scale_degrees(self, notes: List[Dict]) -> List[int]:
        """Get the scale degrees used in the piece."""
        if not notes:
            return []
            
        # Get the key
        key = self._estimate_key(notes)
        key_pitch = list(self.pitch_to_note.keys())[list(self.pitch_to_note.values()).index(key.split()[0])]
        
        # Get all pitch classes relative to the key
        scale_degrees = []
        for note in notes:
            degree = (note['pitch'] - key_pitch) % 12
            if degree not in scale_degrees:
                scale_degrees.append(degree)
                
        return sorted(scale_degrees)
        
    def _find_beat_positions(self, onset_times: List[float]) -> List[float]:
        """Find beat positions from note onset times."""
        if not onset_times:
            return []
            
        # Use onset times as potential beat positions
        beat_positions = sorted(set(onset_times))
        
        # Filter to maintain regular intervals
        if len(beat_positions) >= 2:
            intervals = np.diff(beat_positions)
            median_interval = np.median(intervals)
            
            # Keep only positions that are close to regular intervals
            filtered_positions = [beat_positions[0]]
            for pos in beat_positions[1:]:
                if abs((pos - filtered_positions[-1]) - median_interval) < median_interval * 0.2:
                    filtered_positions.append(pos)
                    
            return filtered_positions
            
        return beat_positions
        
    def _estimate_genre(self, instruments: List[str], harmony: Dict, rhythm: Dict) -> str:
        """Estimate the musical genre based on instruments and musical characteristics."""
        # Simple genre estimation based on instruments
        if any('bass' in inst.lower() for inst in instruments):
            if any('guitar' in inst.lower() for inst in instruments):
                return 'rock'
            elif any('synth' in inst.lower() for inst in instruments):
                return 'electronic'
        elif any('piano' in inst.lower() for inst in instruments):
            if any('violin' in inst.lower() for inst in instruments):
                return 'classical'
            else:
                return 'jazz'
                
        return 'electronic'  # default
        
    def _estimate_mood(self, tempo: float, harmony: Dict, notes: List[Dict]) -> str:
        """Estimate the mood based on musical characteristics."""
        # Calculate note density (notes per second)
        if notes:
            duration = max(note['end_time'] for note in notes)
            note_density = len(notes) / duration
        else:
            note_density = 0
            
        # Simple mood estimation based on tempo and note density
        if tempo > 120 and note_density > 2:
            return 'energetic'
        elif tempo < 90 and note_density < 1:
            return 'calm'
        elif 'minor' in harmony.get('chord_progression', [''])[0]:
            return 'melancholic'
        else:
            return 'upbeat' 