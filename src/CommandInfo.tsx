import { invoke } from '@tauri-apps/api';
import JSON5 from 'json5'

import { executeShellCommand } from './RustFuncs';

import styles from './App.module.css'
import { useRef, useState } from 'react';

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

///////////////////////////////////////////////////////////////////////////////////////////////////
function decoratePath(path: String): string {
  return '"' + path + '"';
}

///////////////////////////////////////////////////////////////////////////////////////////////////
type ExecShellCommand = (
  command: CommandInfo,
  current_dir: string,
  selecting_item_name_ary: string[],
  opposite_path: string,
) => void;

export function commandExecuter(): [JSX.Element, ExecShellCommand,] {
  const dlg: React.MutableRefObject<HTMLDialogElement | null> = useRef(null);
  const [title, setTitle] = useState<string>('');
  const [dlgString, setDlgString] = useState<string>('');
  const [refString, setRefString] = useState<string>('');
  const dlgOnOk = useRef<(dlgInput: string) => void>(() => { });

  const execShellCommandImpl = (
    command_line: string,
    current_dir: string,
    selecting_item_name_ary: string[],
    dialog_input_string: string,
    opposite_dir: string,
  ) => {
    const path_ary = selecting_item_name_ary
      .map(path => decoratePath(current_dir + '\\' + path))
      .join(',');
    const name_ary = selecting_item_name_ary
      .map(decoratePath)
      .join(',');
    const dialog_input_string_ary = dialog_input_string
      .split(/\n/)
      .map(decoratePath)
      .join(',');
    const current_dir_def = `$current_dir = "${current_dir}";`;
    const opposite_dir_def = `$opposite_dir = "${opposite_dir}";`;
    const path_ary_def = `$selecting_item_path_ary = @(${path_ary});`;
    const name_ary_def = `$selecting_item_name_ary = @(${name_ary});`;
    const dialog_input_def = `$dialog_input_str_ary = @(${dialog_input_string_ary});`;

    const command_strs = [path_ary_def, name_ary_def, current_dir_def, opposite_dir_def, dialog_input_def, command_line,];
    const replaced_command_line = command_strs.join('\n');
    console.log(replaced_command_line)
    executeShellCommand(replaced_command_line, current_dir);
  }
  const execShellCommand = (
    command: CommandInfo,
    current_dir: string,
    selecting_item_name_ary: string[],
    opposite_dir: string,
  ) => {
    const fn = (dialog_input_string: string) => {
      execShellCommandImpl(
        command.action.command,
        current_dir,
        selecting_item_name_ary,
        dialog_input_string,
        opposite_dir,
      );
    }

    const type = command.dialog_type;
    if (!type || type === DIALOG_TYPE.none) {
      fn('');
      return;
    }
    if (type === DIALOG_TYPE.reference_selection || type === DIALOG_TYPE.multi_line) {
      setTitle(command.command_name);
      const str = (type === DIALOG_TYPE.reference_selection)
        ? selecting_item_name_ary.join('\n')
        : '';
      setDlgString(str);
      setRefString(str);
      dlg.current?.showModal();
      dlgOnOk.current = fn;
      return;
    }
  }

  const countTextRows = (str: string) => {
    return str.split('\n').length;
  }

  const textAreaWhithRef = () => {
    return <div
      className={styles.DlgTextAreas}
    >
      <textarea
        value={refString}
        disabled={true}
        rows={countTextRows(refString)}
      />
      <textarea
        value={dlgString}
        onChange={e => setDlgString(e.target.value)}
        rows={countTextRows(refString)}
      />
    </div>
  }
  const textArea = () => {
    return <div
      className={styles.DlgSingleTextArea}
    >
      <textarea
        className={styles.DlgTextArea}
        value={dlgString}
        onChange={e => setDlgString(e.target.value)}
      />
    </div>
  }
  const button = () => {
    return <div className={styles.DlgButton}>
      <button
        onClick={() => { dlgOnOk.current(dlgString); dlg.current?.close() }}
      >
        Ok
      </button>
      <button
        onClick={() => { setDlgString(''); dlg.current?.close() }}
      >
        Cancle
      </button>
    </div>
  }

  const element = <dialog
    className={styles.Dlg}
    ref={dlg}
  >
    <div className={styles.DlgLayout}>
      <div className={styles.DlgTitle}>{title}</div>
      {(refString.length === 0) ? textArea() : textAreaWhithRef()}
      {button()}
    </div>
  </dialog>

  return [element, execShellCommand];
}
