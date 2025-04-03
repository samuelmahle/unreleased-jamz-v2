import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

class PromptGenerator:
    def __init__(self):
        """Initialize the prompt generator with musical descriptors."""
        # Genre-specific instrument mappings
        self.genre_instruments = {
            'electronic': ['synthesizer', 'drum machine', 'bass synth'],
            'rock': ['electric guitar', 'bass guitar', 'drums'],
            'classical': ['piano', 'violin', 'cello'],
            'jazz': ['piano', 'saxophone', 'double bass']
        }
        
        # Tempo descriptors
        self.tempo_descriptors = {
            'very_slow': (0, 60),
            'slow': (60, 90),
            'moderate': (90, 120),
            'fast': (120, 160),
            'very_fast': (160, float('inf'))
        }
        
        # Mood descriptors and their musical characteristics
        self.mood_descriptors = {
            'energetic': {
                'tempo_range': (120, float('inf')),
                'dynamics': 'strong',
                'articulation': 'punchy'
            },
            'calm': {
                'tempo_range': (60, 90),
                'dynamics': 'soft',
                'articulation': 'smooth'
            },
            'melancholic': {
                'tempo_range': (60, 100),
                'dynamics': 'medium',
                'articulation': 'legato'
            },
            'upbeat': {
                'tempo_range': (110, 140),
                'dynamics': 'bright',
                'articulation': 'staccato'
            }
        }

    def get_tempo_descriptor(self, bpm: float) -> str:
        """Convert BPM to a descriptive tempo term.
        
        Args:
            bpm (float): Tempo in beats per minute
            
        Returns:
            str: Descriptive tempo term
        """
        for desc, (min_bpm, max_bpm) in self.tempo_descriptors.items():
            if min_bpm <= bpm < max_bpm:
                return desc
        return 'moderate'  # default fallback

    def get_mood_from_features(self, tempo: float, harmony: Dict) -> str:
        """Estimate mood from musical features.
        
        Args:
            tempo (float): Tempo in BPM
            harmony (dict): Harmonic analysis including key and chord progression
            
        Returns:
            str: Estimated mood descriptor
        """
        # TODO: Implement more sophisticated mood detection
        # For now, just use tempo as a simple heuristic
        if tempo > 120:
            return 'energetic'
        elif tempo < 90:
            return 'calm'
        else:
            return 'upbeat'

    def generate_prompt(self, 
                       features: Dict,
                       template: Optional[str] = None) -> str:
        """Generate a text prompt for AudioGen based on musical features.
        
        Args:
            features (dict): Musical features extracted from MIDI
            template (str, optional): Custom prompt template
            
        Returns:
            str: Generated text prompt
        """
        if template is None:
            template = "Create a {genre} track with {mood} feel at {tempo} tempo"
            
        # Extract basic features
        genre = features.get('genre', 'electronic')
        instruments = features.get('instruments', ['synthesizer'])
        tempo = features.get('tempo', 120.0)
        
        # Generate derived features
        tempo_desc = self.get_tempo_descriptor(tempo)
        mood = self.get_mood_from_features(tempo, features.get('harmony', {}))
        
        # Build instrument description
        if len(instruments) > 1:
            instrument_desc = f"{instruments[0]} and {instruments[1]}"
        else:
            instrument_desc = instruments[0]
            
        # Format the prompt
        prompt = template.format(
            genre=genre,
            instruments=instrument_desc,
            tempo=tempo_desc,
            mood=mood
        )
        
        # Add additional musical context
        context = []
        if 'key' in features:
            context.append(f"in the key of {features['key']}")
        if 'time_signature' in features:
            num, den = features['time_signature']
            context.append(f"in {num}/{den} time")
            
        if context:
            prompt += f" {', '.join(context)}"
            
        logger.info(f"Generated prompt: {prompt}")
        return prompt

    def generate_variations(self, 
                          base_prompt: str, 
                          n_variations: int = 3) -> List[str]:
        """Generate variations of a base prompt.
        
        Args:
            base_prompt (str): Original prompt
            n_variations (int): Number of variations to generate
            
        Returns:
            list: List of prompt variations
        """
        # TODO: Implement more sophisticated variation generation
        variations = [base_prompt]
        
        # Simple variations by adding modifiers
        modifiers = [
            "with a strong beat",
            "with melodic elements",
            "with atmospheric sounds",
            "with rhythmic patterns",
            "with dynamic changes"
        ]
        
        for i in range(min(n_variations - 1, len(modifiers))):
            variations.append(f"{base_prompt} {modifiers[i]}")
            
        return variations 