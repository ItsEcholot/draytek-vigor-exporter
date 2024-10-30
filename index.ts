import {createServer} from 'http';
import {NodeSSH} from 'node-ssh';
import {Registry, Gauge} from 'prom-client';
import {getName} from './utils';
import {MODEM_HOST, MODEM_PASSWORD, MODEM_USERNAME, PORT} from './constants';

const ssh = new NodeSSH();

const registry = new Registry();
registry.setDefaultLabels({
  instance: MODEM_HOST,
});

const lineState = new Gauge<string>({
  name: getName('line_state'),
  help: 'Line state',
});

registry.registerMetric(lineState);

const server = createServer(async (req, res) => {
  if (!req.url) {
    return;
  }

  if (req.url === '/metrics') {
    await ssh.connect({
      host: MODEM_HOST,
      username: MODEM_USERNAME,
      password: MODEM_PASSWORD,
      algorithms: {
        kex: {append: 'diffie-hellman-group1-sha1', prepend: [], remove: []},
        serverHostKey: {append: 'ssh-dss', prepend: [], remove: []},
      }
    });
    const shell = await ssh.requestShell();
    shell.on('data', (data: Buffer) => {
      console.log(data.toString());
    });
    shell.write('vdsl status\n');
    shell.close();
    ssh.dispose();

    res.setHeader('Content-Type', registry.contentType);
    res.end(await registry.metrics());
  }
});

server.listen(PORT);