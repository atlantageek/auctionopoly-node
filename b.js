const redis = require('redis');
const client = redis.createClient();

client.on('error', err => console.log('Redis Client Error', err));

async function run() {
await client.connect();

//await client.set('key', 'value');
//const value = await client.get('key');
//await client.sendCommand(['hset','key3', 'f1','v1','f2','v2'] );
await client.hMSet('key3', 'f1','v1','f2','v2' );
//const value2 = await client.get('key2');
//console.log(value)
//console.log(value2)
await client.disconnect();
}

run();
