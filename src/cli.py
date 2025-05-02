import argparse
import logging
from pathlib import Path
from midi_to_audio import MidiToAudioGenerator
from prompt_generator import PromptGenerator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Convert MIDI files to audio using AudioGen"
    )
    
    parser.add_argument(
        "input",
        type=str,
        help="Path to input MIDI file"
    )
    
    parser.add_argument(
        "-o", "--output",
        type=str,
        default=None,
        help="Path to output audio file (default: input_generated.wav)"
    )
    
    parser.add_argument(
        "-d", "--duration",
        type=float,
        default=10.0,
        help="Duration of generated audio in seconds (default: 10.0)"
    )
    
    parser.add_argument(
        "-n", "--num-variations",
        type=int,
        default=1,
        help="Number of variations to generate (default: 1)"
    )
    
    parser.add_argument(
        "-t", "--template",
        type=str,
        default=None,
        help="Custom prompt template (default: None)"
    )
    
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug logging"
    )
    
    return parser.parse_args()

def main():
    """Main entry point."""
    args = parse_args()
    
    # Set up logging
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
        
    # Validate input path
    input_path = Path(args.input)
    if not input_path.exists():
        logger.error(f"Input file not found: {input_path}")
        return 1
        
    # Set up output path
    if args.output is None:
        output_path = input_path.with_name(f"{input_path.stem}_generated.wav")
    else:
        output_path = Path(args.output)
        
    # Create output directory if needed
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        # Initialize generator
        logger.info("Initializing AudioGen model...")
        generator = MidiToAudioGenerator()
        
        # Generate audio
        logger.info(f"Processing MIDI file: {input_path}")
        generator.midi_to_audio(
            input_path,
            output_path,
            prompt_template=args.template
        )
        
        # Generate variations if requested
        if args.num_variations > 1:
            logger.info(f"Generating {args.num_variations - 1} variations...")
            features = generator.process_midi(input_path)
            prompt_gen = PromptGenerator()
            base_prompt = prompt_gen.generate_prompt(features, args.template)
            variations = prompt_gen.generate_variations(
                base_prompt,
                args.num_variations
            )
            
            # Generate audio for each variation
            for i, prompt in enumerate(variations[1:], 1):
                var_path = output_path.with_name(f"{output_path.stem}_var{i}.wav")
                wav = generator.generate_audio(prompt, duration=args.duration)
                generator.save_audio(wav, var_path)
                
        logger.info("Done!")
        return 0
        
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        if args.debug:
            logger.exception(e)
        return 1

if __name__ == "__main__":
    exit(main()) 