# MIDI to Audio Generator

This project uses Meta's AudioGen model to generate audio tracks based on MIDI input. It analyzes MIDI files for musical features and generates appropriate prompts for AudioGen to create corresponding audio output.

## Features

- MIDI file analysis (tempo, key, harmony, rhythm)
- Musical feature extraction
- Intelligent prompt generation for AudioGen
- Audio generation with customizable parameters
- Support for multiple output variations

## Installation

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

Basic usage:

```python
from src.midi_to_audio import MidiToAudioGenerator

# Initialize generator
generator = MidiToAudioGenerator()

# Convert MIDI to audio
generator.midi_to_audio(
    midi_path="input.mid",
    output_path="output.wav"
)
```

Advanced usage with custom prompt:

```python
from src.midi_processor import MidiProcessor
from src.prompt_generator import PromptGenerator

# Initialize components
processor = MidiProcessor()
prompt_gen = PromptGenerator()

# Extract features
features = processor.extract_features("input.mid")

# Generate custom prompt
prompt = prompt_gen.generate_prompt(
    features,
    template="Create a {genre} track with {instruments} at {tempo} tempo"
)

# Generate variations
variations = prompt_gen.generate_variations(prompt, n_variations=3)
```

## Project Structure

```
.
├── src/
│   ├── midi_to_audio.py     # Main module
│   ├── midi_processor.py    # MIDI analysis
│   └── prompt_generator.py  # Prompt generation
├── tests/                   # Test files
├── data/                    # Sample MIDI files
├── requirements.txt         # Dependencies
└── README.md               # Documentation
```

## Dependencies

- torch
- torchaudio
- audiocraft
- midiutil
- python-midi
- numpy
- soundfile
- tqdm
- transformers

## TODO

- [ ] Implement complete MIDI parsing and feature extraction
- [ ] Add more sophisticated harmonic analysis
- [ ] Improve genre and mood detection
- [ ] Add support for batch processing
- [ ] Implement more advanced prompt variation generation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
