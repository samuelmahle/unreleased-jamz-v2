from midiutil import MIDIFile
from pathlib import Path

def create_test_midi(output_path="data/test.mid"):
    """Create a simple test MIDI file with a basic melody.
    
    Args:
        output_path (str): Path to save the MIDI file
    """
    # Create MIDI file with 1 track
    midi = MIDIFile(1)
    track = 0
    time = 0
    channel = 0
    
    # Set tempo and time signature
    tempo = 120
    midi.addTempo(track, time, tempo)
    midi.addTimeSignature(track, time, 4, 2, 24)  # 4/4 time
    
    # Add a simple C major scale
    duration = 1  # quarter note
    volume = 100
    scale = [60, 62, 64, 65, 67, 69, 71, 72]  # C4 to C5
    
    for i, pitch in enumerate(scale):
        midi.addNote(track, channel, pitch, time + i, duration, volume)
        
    # Add a simple chord progression (C, F, G, C)
    time = len(scale)
    chords = [
        [60, 64, 67],  # C major
        [65, 69, 72],  # F major
        [67, 71, 74],  # G major
        [60, 64, 67]   # C major
    ]
    
    for chord in chords:
        for note in chord:
            midi.addNote(track, channel, note, time, 2, volume)
        time += 2
        
    # Create output directory if it doesn't exist
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Save MIDI file
    with open(output_path, "wb") as f:
        midi.writeFile(f)
        
if __name__ == "__main__":
    create_test_midi() 