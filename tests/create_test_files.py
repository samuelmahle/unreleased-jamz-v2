import pretty_midi
import numpy as np
from pathlib import Path

def create_test_files():
    """Create various test MIDI files with different musical characteristics."""
    output_dir = Path("tests/data")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Create electronic track
    create_electronic_track(output_dir / "electronic.mid")
    
    # Create classical piece
    create_classical_piece(output_dir / "classical.mid")
    
    # Create rock song
    create_rock_song(output_dir / "rock.mid")
    
    # Create jazz improvisation
    create_jazz_improvisation(output_dir / "jazz.mid")
    
    # Create simple melody
    create_simple_melody(output_dir / "simple.mid")

def create_electronic_track(output_path: Path):
    """Create an electronic track with synthesizer and drums."""
    pm = pretty_midi.PrettyMIDI()
    
    # Add synthesizer track
    synth = pretty_midi.Instrument(program=80)  # Square lead
    for i in range(4):
        # Add bass note
        note = pretty_midi.Note(
            velocity=100,
            pitch=36 + i * 12,  # C1, C2, C3, C4
            start=float(i * 2),
            end=float(i * 2 + 1.5)
        )
        synth.notes.append(note)
        
        # Add lead melody
        for j in range(4):
            note = pretty_midi.Note(
                velocity=80,
                pitch=60 + j * 2,  # C4, D4, E4, F#4
                start=float(i * 2 + j * 0.5),
                end=float(i * 2 + j * 0.5 + 0.3)
            )
            synth.notes.append(note)
    
    # Add drum track
    drums = pretty_midi.Instrument(program=128)  # Synth drum
    for i in range(8):
        # Kick drum
        note = pretty_midi.Note(
            velocity=100,
            pitch=36,  # C1
            start=float(i),
            end=float(i + 0.1)
        )
        drums.notes.append(note)
        
        # Snare drum
        note = pretty_midi.Note(
            velocity=80,
            pitch=38,  # D1
            start=float(i + 0.5),
            end=float(i + 0.6)
        )
        drums.notes.append(note)
    
    pm.instruments.append(synth)
    pm.instruments.append(drums)
    pm.write(str(output_path))

def create_classical_piece(output_path: Path):
    """Create a simple classical piece with piano and strings."""
    pm = pretty_midi.PrettyMIDI()
    
    # Add piano track
    piano = pretty_midi.Instrument(program=0)
    
    # Add arpeggiated chords
    chords = [
        [60, 64, 67],  # C major
        [65, 69, 72],  # F major
        [67, 71, 74],  # G major
        [60, 64, 67]   # C major
    ]
    
    for i, chord in enumerate(chords):
        for j, pitch in enumerate(chord):
            note = pretty_midi.Note(
                velocity=80,
                pitch=pitch,
                start=float(i * 2 + j * 0.2),
                end=float(i * 2 + j * 0.2 + 0.3)
            )
            piano.notes.append(note)
    
    # Add string track
    strings = pretty_midi.Instrument(program=48)  # String ensemble
    for i in range(4):
        note = pretty_midi.Note(
            velocity=70,
            pitch=60 + i * 2,  # C4, D4, E4, F#4
            start=float(i * 2),
            end=float(i * 2 + 1.5)
        )
        strings.notes.append(note)
    
    pm.instruments.append(piano)
    pm.instruments.append(strings)
    pm.write(str(output_path))

def create_rock_song(output_path: Path):
    """Create a simple rock song with guitar, bass, and drums."""
    pm = pretty_midi.PrettyMIDI()
    
    # Add electric guitar track
    guitar = pretty_midi.Instrument(program=30)  # Distortion guitar
    for i in range(4):
        # Power chord
        for pitch in [60, 64, 67]:  # C5, E5, G5
            note = pretty_midi.Note(
                velocity=100,
                pitch=pitch,
                start=float(i * 2),
                end=float(i * 2 + 1.5)
            )
            guitar.notes.append(note)
    
    # Add bass track
    bass = pretty_midi.Instrument(program=33)  # Electric bass
    for i in range(4):
        note = pretty_midi.Note(
            velocity=90,
            pitch=36 + i * 12,  # C1, C2, C3, C4
            start=float(i * 2),
            end=float(i * 2 + 1.5)
        )
        bass.notes.append(note)
    
    # Add drum track
    drums = pretty_midi.Instrument(program=128)  # Synth drum
    for i in range(8):
        # Kick drum
        note = pretty_midi.Note(
            velocity=100,
            pitch=36,  # C1
            start=float(i),
            end=float(i + 0.1)
        )
        drums.notes.append(note)
        
        # Snare drum
        note = pretty_midi.Note(
            velocity=80,
            pitch=38,  # D1
            start=float(i + 0.5),
            end=float(i + 0.6)
        )
        drums.notes.append(note)
    
    pm.instruments.append(guitar)
    pm.instruments.append(bass)
    pm.instruments.append(drums)
    pm.write(str(output_path))

def create_jazz_improvisation(output_path: Path):
    """Create a jazz improvisation with piano and bass."""
    pm = pretty_midi.PrettyMIDI()
    
    # Add piano track with jazz chords
    piano = pretty_midi.Instrument(program=0)
    chords = [
        [60, 64, 67, 70],  # C7
        [65, 69, 72, 75],  # F7
        [67, 71, 74, 77],  # G7
        [60, 64, 67, 70]   # C7
    ]
    
    for i, chord in enumerate(chords):
        for pitch in chord:
            note = pretty_midi.Note(
                velocity=70,
                pitch=pitch,
                start=float(i * 2),
                end=float(i * 2 + 1.5)
            )
            piano.notes.append(note)
    
    # Add walking bass line
    bass = pretty_midi.Instrument(program=32)  # Acoustic bass
    for i in range(8):
        note = pretty_midi.Note(
            velocity=80,
            pitch=36 + i,  # Walking up the scale
            start=float(i),
            end=float(i + 0.5)
        )
        bass.notes.append(note)
    
    pm.instruments.append(piano)
    pm.instruments.append(bass)
    pm.write(str(output_path))

def create_simple_melody(output_path: Path):
    """Create a simple melody with piano."""
    pm = pretty_midi.PrettyMIDI()
    
    # Add piano track
    piano = pretty_midi.Instrument(program=0)
    
    # Simple C major scale
    for i, pitch in enumerate([60, 62, 64, 65, 67, 69, 71, 72]):  # C4 to C5
        note = pretty_midi.Note(
            velocity=80,
            pitch=pitch,
            start=float(i),
            end=float(i + 0.5)
        )
        piano.notes.append(note)
    
    pm.instruments.append(piano)
    pm.write(str(output_path))

if __name__ == "__main__":
    create_test_files() 