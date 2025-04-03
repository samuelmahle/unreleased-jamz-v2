import unittest
import sys
from pathlib import Path
from create_test_files import create_test_files

def run_tests():
    """Run all tests and generate test files."""
    # Create test files first
    print("Generating test MIDI files...")
    create_test_files()
    
    # Run tests
    print("\nRunning tests...")
    loader = unittest.TestLoader()
    start_dir = Path(__file__).parent
    suite = loader.discover(start_dir, pattern="test_*.py")
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Return 0 if tests passed, 1 if they failed
    return 0 if result.wasSuccessful() else 1

if __name__ == "__main__":
    sys.exit(run_tests()) 