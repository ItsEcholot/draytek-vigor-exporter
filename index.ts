import {createServer} from 'http';
import {Config as NodeSSHConfig, NodeSSH} from 'node-ssh';
import {
  AlgorithmList,
  ClientChannel,
  KexAlgorithm,
  ServerHostKeyAlgorithm
} from 'ssh2';
import {Registry, Gauge} from 'prom-client';
import {getName, getStatusVariable, getStatusVariableNumber} from './utils';
import {
  MODEM_HOST,
  MODEM_PASSWORD,
  MODEM_USERNAME,
  PORT,
  KEY_EXCHANGE_ALGORITHM,
  SERVER_HOST_KEY_ALGORITHM,
  SHELL_COMMAND_VDSL_STATUS,
  SHELL_PROMPT,
  VDSL_READY_STATE
} from './constants';

const ssh = new NodeSSH();
const sshConnectionConfig: NodeSSHConfig = {
  host: MODEM_HOST,
  username: MODEM_USERNAME,
  password: MODEM_PASSWORD,
  algorithms: {
    kex: [KEY_EXCHANGE_ALGORITHM] as AlgorithmList<KexAlgorithm>,
    serverHostKey: [SERVER_HOST_KEY_ALGORITHM] as AlgorithmList<ServerHostKeyAlgorithm>,
  },
};

const registry = new Registry();
registry.setDefaultLabels({
  instance: MODEM_HOST,
});

const lineState = new Gauge({
  name: getName('line_state_ready'),
  help: 'Line state ready',
});
registry.registerMetric(lineState);
const dsActualRate = new Gauge({
  name: getName('ds_actual_rate_bps'),
  help: 'DownStream Actual Rate in bps',
});
registry.registerMetric(dsActualRate);
const usActualRate = new Gauge({
  name: getName('us_actual_rate_bps'),
  help: 'UpStream Actual Rate in bps',
});
registry.registerMetric(usActualRate);
const dsAttainableRate = new Gauge({
  name: getName('ds_attainable_rate_bps'),
  help: 'DownStream Attainable Rate in bps',
});
registry.registerMetric(dsAttainableRate);
const usAttainableRate = new Gauge({
  name: getName('us_attainable_rate_bps'),
  help: 'UpStream Attainable Rate in bps',
});
registry.registerMetric(usAttainableRate);
const neCurrentAttenuation = new Gauge({
  name: getName('ne_current_attenuation_db'),
  help: 'Near End Current Attenuation in dB',
});
registry.registerMetric(neCurrentAttenuation);
const curSNRMargin = new Gauge({
  name: getName('cur_snr_margin_db'),
  help: 'Current Signal-To-Noise Margin in dB',
});
registry.registerMetric(curSNRMargin);
const dsActualPSD = new Gauge({
  name: getName('ds_actual_psd_db'),
  help: 'DownStream Actual Power Spectral Density in dB',
});
registry.registerMetric(dsActualPSD);
const usActualPSD = new Gauge({
  name: getName('us_actual_psd_db'),
  help: 'UpStream Actual Power Spectral Density in dB',
});
registry.registerMetric(usActualPSD);
const neCRCCount = new Gauge({
  name: getName('ne_crc_count'),
  help: 'Near End CRC Count',
});
registry.registerMetric(neCRCCount);
const feCRCCount = new Gauge({
  name: getName('fe_crc_count'),
  help: 'Far End CRC Count',
});
registry.registerMetric(feCRCCount);
const neESCount = new Gauge({
  name: getName('ne_es_count'),
  help: 'Near End Errored Seconds Count',
});
registry.registerMetric(neESCount);
const feESCount = new Gauge({
  name: getName('fe_es_count'),
  help: 'Far End Errored Seconds Count',
});
registry.registerMetric(feESCount);
const xdslResetTimes = new Gauge({
  name: getName('xdsl_reset_times'),
  help: 'xDSL Reset Times',
});
registry.registerMetric(xdslResetTimes);
const xdslLinkTimes = new Gauge({
  name: getName('xdsl_link_times'),
  help: 'xDSL Link Times',
});
registry.registerMetric(xdslLinkTimes);

const server = createServer(async (req, res) => {
  if (!req.url) {
    return;
  }

  if (req.url === '/metrics') {
      try {
      await ssh.connect(sshConnectionConfig);
      const shell = await ssh.requestShell();
      
      let gotInitialPrompt = false;
      let payload = '';
      const dataPromise = new Promise<string>((resolve) => shell.on('data', (data: Buffer) => {
        if (!gotInitialPrompt && data.toString().includes(SHELL_PROMPT)) {
          gotInitialPrompt = true;
          return;
        } else if (gotInitialPrompt && !data.toString().includes(SHELL_PROMPT)) {
          payload += data.toString();
          return;
        } else {
          resolve(payload);
        }
      }));
      shell.write(`${SHELL_COMMAND_VDSL_STATUS}\n`);
      const data = await dataPromise;

      lineState.set(getStatusVariable('State', data) === VDSL_READY_STATE ? 1 : 0);
      dsActualRate.set(getStatusVariableNumber('DS Actual Rate', data));
      usActualRate.set(getStatusVariableNumber('US Actual Rate', data));
      dsAttainableRate.set(getStatusVariableNumber('DS Attainable Rate', data));
      usAttainableRate.set(getStatusVariableNumber('US Attainable Rate', data));
      neCurrentAttenuation.set(getStatusVariableNumber('NE Current Attenuation', data));
      curSNRMargin.set(getStatusVariableNumber('Cur SNR Margin', data));
      dsActualPSD.set(getStatusVariableNumber('DS actual PSD', data));
      usActualPSD.set(getStatusVariableNumber('US actual PSD', data));
      neCRCCount.set(getStatusVariableNumber('NE CRC Count', data));
      feCRCCount.set(getStatusVariableNumber('FE CRC Count', data));
      neESCount.set(getStatusVariableNumber('NE ES Count', data));
      feESCount.set(getStatusVariableNumber('FE  ES Count', data));
      xdslResetTimes.set(getStatusVariableNumber('Xdsl Reset Times', data));
      xdslLinkTimes.set(getStatusVariableNumber('Xdsl Link  Times', data));

      shell.close();
      ssh.dispose();

      res.setHeader('Content-Type', registry.contentType);
      res.end(await registry.metrics());
    } catch (error) {
      ssh.dispose();
      res.statusCode = 500;
      res.end();
    }
  }
});

server.listen(PORT);