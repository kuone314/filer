import { invoke } from '@tauri-apps/api';
import JSON5 from 'json5'


///////////////////////////////////////////////////////////////////////////////////////////////////
export const COMMAND_TYPE = {
  build_in: "build_in",
  power_shell: "power_shell",
} as const;
type CommandType = typeof COMMAND_TYPE[keyof typeof COMMAND_TYPE];

export const DIALOG_TYPE = {
  none: "none",
  multi_line: "multi_line",
  reference_selection: "reference_selection",
} as const;
export type DialogType = typeof DIALOG_TYPE[keyof typeof DIALOG_TYPE];


export type CommandInfo = {
  command_name: string,
  key: string,
  dialog_type: DialogType,
  action: {
    type: CommandType,
    command: string,
  }
};

///////////////////////////////////////////////////////////////////////////////////////////////////
function match(keyboard_event: KeyboardEvent, command_key: string): boolean {
  const key_ary = command_key.split('+').map(key => key.toLocaleLowerCase());
  if (key_ary.includes('ctrl') !== keyboard_event.ctrlKey) { return false; }
  if (key_ary.includes('alt') !== keyboard_event.altKey) { return false; }
  if (key_ary.includes('shift') !== keyboard_event.shiftKey) { return false; }

  const setting_key = key_ary[key_ary.length - 1].toLocaleLowerCase();
  if (setting_key === keyboard_event.key.toLocaleLowerCase()) { return true; }
  if (keyboard_event.key === ' ' && setting_key === 'space') { return true; }

  return false;
}

async function readCommandsSetting(): Promise<CommandInfo[]> {
  const setting_str = await invoke<String>("read_setting_file", { filename: "key_bind.json5" });
  const setting_ary = JSON5.parse(setting_str.toString()) as CommandInfo[];
  return setting_ary;
}

export async function matchingKeyEvent(keyboard_event: KeyboardEvent) {
  const commands = await readCommandsSetting();
  return commands.filter(cmd => match(keyboard_event, cmd.key));
}
