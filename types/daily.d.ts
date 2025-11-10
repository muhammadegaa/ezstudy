declare global {
  interface Window {
    DailyIframe: {
      createFrame: (options?: any) => DailyCallFrame;
    };
  }
}

export interface DailyCallFrame {
  iframe: () => HTMLIFrameElement;
  join: (options: { url: string; token?: string }) => Promise<void>;
  leave: () => Promise<void>;
  destroy: () => void;
  setLocalAudio: (enabled: boolean) => void;
  setLocalVideo: (enabled: boolean) => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  sendAppMessage: (data: any, to?: string) => void;
  on: (event: string, callback: (event?: any) => void) => DailyCallFrame;
}

export {};

