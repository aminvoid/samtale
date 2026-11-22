export { useMockExam, type MockExamAction } from "./runner/use-mock-exam";
export type { MockExamSetup } from "./runner/runtime";
export type {
  AnnouncePort,
  AudioPort,
  Clock,
  MarkerPort,
  MicResult,
  MockExamDestination,
  MockExamPorts,
  ProgressPort,
  RecorderPort,
  SessionRecordingPort,
  VisibilityPort,
  WakeLockPort,
} from "./runner/ports";
export { MockSessionProvider, useMockSession } from "./runner/adapters/mock-session-provider";
export { useBrowserMockExamPorts } from "./runner/adapters/use-browser-mock-exam-ports";
export type { MicrophoneStrategy } from "./runner/adapters/recorder";
export type { MockSessionRecordings } from "./runner/adapters/session-recordings";
export { elapsed, remaining } from "./machine";
export type { AttemptRecord, Mode, State } from "./machine";
export { ClearMockReloadMarker } from "./screens/clear-mock-reload-marker";
