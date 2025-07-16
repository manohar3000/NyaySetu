import { useState, useEffect, useCallback } from 'react';

interface UseSpeechRecognitionProps {
  onResult: (text: string) => void;
  onError?: (error: string) => void;
}

export const useSpeechRecognition = ({ onResult, onError }: UseSpeechRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if browser supports speech recognition
    const speechRecognitionAPI = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (!speechRecognitionAPI) {
      setIsSupported(false);
      onError?.('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    setIsSupported(true);

    // Initialize speech recognition
    const recognitionInstance = new speechRecognitionAPI();

    recognitionInstance.continuous = false; // Changed to false to better handle single utterances
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onstart = () => {
      setIsListening(true);
      console.log('Speech recognition started');
    };

    recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');

      console.log('Speech recognition result:', transcript);

      if (event.results[0].isFinal) {
        onResult(transcript);
        stopListening();
      }
    };

    recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      let errorMessage = 'An error occurred with speech recognition.';
      
      switch (event.error) {
        case 'network':
          errorMessage = 'Network error occurred. Please check your internet connection.';
          break;
        case 'not-allowed':
        case 'permission-denied':
          errorMessage = 'Microphone permission is required for speech recognition.';
          break;
        case 'no-speech':
          errorMessage = 'No speech was detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone was found. Please check your microphone settings.';
          break;
      }
      
      onError?.(errorMessage);
      stopListening();
    };

    recognitionInstance.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
    };

    setRecognition(recognitionInstance);

    return () => {
      if (recognitionInstance) {
        recognitionInstance.abort();
      }
    };
  }, [onResult, onError]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      onError?.('Speech recognition is not supported in this browser.');
      return;
    }

    if (recognition) {
      try {
        recognition.abort(); // Clear any existing recognition
        recognition.start();
        console.log('Starting speech recognition...');
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        onError?.('Failed to start speech recognition. Please try again.');
        setIsListening(false);
      }
    }
  }, [recognition, onError, isSupported]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
      console.log('Stopping speech recognition...');
    }
  }, [recognition]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    toggleListening,
    startListening,
    stopListening,
    isSupported
  };
}; 