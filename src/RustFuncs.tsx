import { invoke } from '@tauri-apps/api';

///////////////////////////////////////////////////////////////////////////////////////////////////
export function executeShellCommand(command: string, dir: string): Promise<String> {
  return invoke<String>("execute_shell_command", { command: command, dir: dir });
}
