declare global {
  interface Window {
    SC: {
      Widget: {
        (iframe: HTMLIFrameElement): {
          bind: (event: string, callback: () => void) => void;
          play: () => void;
          pause: () => void;
          seekTo: (position: number) => void;
          getDuration: (callback: (duration: number) => void) => void;
          getPosition: (callback: (position: number) => void) => void;
        };
        Events: {
          READY: string;
          PLAY: string;
          PAUSE: string;
          FINISH: string;
          PLAY_PROGRESS: string;
          SEEK: string;
        };
      };
    };
  }
}

export {}; 