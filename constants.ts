export const PORT = process.env.PORT || 3000;
export const MODEM_HOST = process.env.MODEM_HOST || '192.168.2.1';
export const MODEM_USERNAME = process.env.MODEM_USERNAME || 'admin';
export const MODEM_PASSWORD = process.env.MODEM_PASSWORD || 'admin';
export const METRIC_NAME_PREFIX = process.env.METRIC_NAME_PREFIX || 'vigor';

export const KEY_EXCHANGE_ALGORITHM = process.env.KEY_EXCHANGE_ALGORITHM || 'diffie-hellman-group1-sha1';
export const SERVER_HOST_KEY_ALGORITHM = process.env.SERVER_HOST_KEY_ALGORITHM || 'ssh-dss';

export const SHELL_PROMPT = 'DrayTek>';
export const SHELL_COMMAND_VDSL_STATUS = 'vdsl status';
export const VDSL_READY_STATE = 'SHOWTIME';