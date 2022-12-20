
///////////////////////////////////////////////////////////////////////////////////////////////////
export const COMMAND_TYPE = {
  build_in: "build_in",
  power_shell: "power_shell",
} as const;
type CommandType = typeof COMMAND_TYPE[keyof typeof COMMAND_TYPE];

export type CommandInfo = {
  command_name: string,
  key: string,
  action: {
    type: CommandType,
    command: string,
  }
};

