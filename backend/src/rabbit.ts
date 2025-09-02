import type { ChannelModel, Channel } from 'amqplib';
const amqplib = require('amqplib');

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

async function getChannel() {
  if (channel) return channel;

  const u = new URL(process.env.AMQP_URL || 'amqp://localhost:5672');
  u.username = process.env.AMQP_USER || 'dev';
  u.password = process.env.AMQP_PASS || 'dev';

  const vhost = (process.env.AMQP_VHOST || 'dev').trim();
  u.pathname = `/${encodeURIComponent(vhost)}`;

  // DEBUG: show full URL including vhost (mask password)
  const shown = `${u.protocol}//${u.username}:****@${u.hostname}${u.port ? ':' + u.port : ''}${u.pathname || '/'}`;
  console.log('[amqp] connecting to', shown);
  connection = await amqplib.connect(u.toString(), { heartbeat: 30 });

  if (!connection) 
    throw new Error('Failed to establish AMQP connection');

  channel = await connection.createChannel();
  return channel!;
}

async function closeRabbit() {
  await channel?.close();
  await connection?.close();
  channel = null;
  connection = null;
}

module.exports = { getChannel, closeRabbit };