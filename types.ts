export enum Speaker {
  SYSTEM = 'System',
  COPILOT = 'Co-Pilot',
  DISPATCHER = 'Dispatcher',
  VIP = 'VIP (CEO)',
  PILOT = 'You (PIC)'
}

export enum GameStatus {
  START = 'START',
  ACTIVE = 'ACTIVE',
  CRASHED = 'CRASHED',
  SUCCESS = 'SUCCESS', // Safe No-Go
  FAILED = 'FAILED', // Unsafe Go or wrong regulatory logic
  LOADING = 'LOADING'
}

export interface DialogueLine {
  speaker: string;
  text: string;
  timestamp: string;
}

export interface SimulationState {
  visualDescription: string;
  dialogue: DialogueLine[];
  status: GameStatus;
  feedback?: string; // Why you failed/passed
}

export interface WeatherData {
  metar: string;
  taf: string;
}