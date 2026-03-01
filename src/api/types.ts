/**
 * API types matching hootcam-server schemas.
 */

export interface ApiInfo {
  name: string;
  version: string;
  docs: string;
  openapi: string;
  cameras: string;
  config: string;
  events: string;
}

export interface GlobalConfig {
  target_dir?: string | null;
  log_level?: number | null;
  log_file?: string | null;
  stream_localhost?: boolean | null;
  stream_quality?: number | null;
  stream_maxrate?: number | null;
  stream_grey?: boolean | null;
  stream_motion?: boolean | null;
  /** Seconds with no frame before marking camera failed. Default 15. */
  stream_failure_sec?: number | null;
  /** When failed, re-attempt reading every this many seconds. Default 5. */
  stream_retry_sec?: number | null;
  database_busy_timeout?: number | null;
}

export type PictureOutputType = 'on' | 'off' | 'first' | 'best';
export type LocateMotionMode = 'on' | 'off' | 'preview';
export type LocateMotionStyle = 'box' | 'redbox' | 'cross' | 'redcross';
export type FlipAxis = 'none' | 'v' | 'h';
export type MovieCodec =
  | 'mpeg4' | 'msmpeg4' | 'swf' | 'flv' | 'ffv1' | 'mov' | 'mp4' | 'mkv' | 'hevc';
export type PictureType = 'jpeg' | 'webp' | 'ppm' | 'grey';

export interface CameraConfig {
  camera_name?: string | null;
  camera_id?: number | null;
  /** Video stream URL (e.g. from Hootcam Streamer: http://pi-ip:8082/stream). Required for motion/recording. */
  stream_url?: string | null;
  width?: number | null;
  height?: number | null;
  framerate?: number | null;
  minimum_frame_time?: number | null;
  rotate?: 0 | 90 | 180 | 270 | null;
  flip_axis?: FlipAxis | null;
  threshold?: number | null;
  threshold_maximum?: number | null;
  threshold_tune?: boolean | null;
  noise_level?: number | null;
  noise_tune?: boolean | null;
  despeckle_filter?: string | null;
  minimum_motion_frames?: number | null;
  event_gap?: number | null;
  pre_capture?: number | null;
  post_capture?: number | null;
  pause?: boolean | null;
  emulate_motion?: boolean | null;
  picture_output?: PictureOutputType | null;
  picture_output_motion?: boolean | null;
  picture_type?: PictureType | null;
  picture_quality?: number | null;
  picture_filename?: string | null;
  snapshot_interval?: number | null;
  snapshot_filename?: string | null;
  movie_output?: boolean | null;
  movie_output_motion?: boolean | null;
  movie_max_time?: number | null;
  movie_bps?: number | null;
  movie_quality?: number | null;
  movie_codec?: MovieCodec | null;
  movie_filename?: string | null;
  locate_motion_mode?: LocateMotionMode | null;
  locate_motion_style?: LocateMotionStyle | null;
  text_left?: string | null;
  text_right?: string | null;
  text_changes?: boolean | null;
  text_scale?: number | null;
  text_event?: string | null;
  on_event_start?: string | null;
  on_event_end?: string | null;
  on_motion_detected?: string | null;
  on_picture_save?: string | null;
  on_movie_start?: string | null;
  on_movie_end?: string | null;
  sql_log_picture?: boolean | null;
  sql_log_movie?: boolean | null;
  sql_log_snapshot?: boolean | null;
}

export interface ConfigResponse {
  global_config: GlobalConfig;
  cameras: CameraConfig[];
}

export interface StorageResponse {
  current_path: string;
  auto_detected_ssd_path?: string | null;
}

export interface StorageUpdate {
  path?: string | null;
  use_auto_detected_ssd?: boolean | null;
}

export interface CameraInfo {
  id: number;
  name: string | null;
  camera_id: number | null;
  detection_paused: boolean;
  stream_url: string;
}

export interface CameraResolution {
  width: number;
  height: number;
  fps: number;
}

export interface CameraStatus {
  camera_index: number;
  connected: boolean;
}

export interface DetectionStatus {
  camera_index: number;
  paused: boolean;
  in_event: boolean;
  event_id: number | null;
}

export interface EventSummary {
  id: number;
  camera_index: number;
  camera_id: number | null;
  started_at: string;
  ended_at: string | null;
  file_count: number;
}

export interface FileRecord {
  id: number;
  event_id: number | null;
  camera_index: number;
  file_type: string;
  file_path: string;
  timestamp: string;
  frame_number: number | null;
}

export interface PasswordChangeBody {
  new_password: string;
}
