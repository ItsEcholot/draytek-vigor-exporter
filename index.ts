import {Registry, Gauge} from 'prom-client';
import {getName} from './utils';
import {MODEM_HOST, PORT} from './constants';
import {createServer} from 'http';

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
    res.setHeader('Content-Type', registry.contentType);
    res.end(await registry.metrics());
  }
});

server.listen(PORT);