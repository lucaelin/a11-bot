const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');
client.login(config.token);

async function waitFor(c, ref) {
  const [d, h, m, s] = c.split(' ');
  let t = ref.getTime();
  t += d * 24*60*60*1000;
  t += h * 60*60*1000;
  t += m * 60*1000;
  t += s * 1000;
  const delta = t - Date.now();
  if (delta<0) {
    throw new Error('prior to now');
  } else {
    await new Promise(res => setTimeout(res, delta));
  }
  console.log(new Date(t));
}

async function* chat() {
  const options = {};
  const dom  = await JSDOM.fromFile(config.source, options);
  const body = dom.window.document.body;
  const view = dom.window.document.defaultView;

  const launch = new Date('2019-07-16T13:32:00.000Z');
  
  let skip = true;
  for(const e of body.childNodes) {
    const text = e.textContent;
    const res = /\n\n(\d\d \d\d \d\d \d\d)        /.exec(text);
    if(res !== null) {
      skip = false;
      await waitFor(res[1], launch).catch(()=>{
        skip = true;
      });
    } else {
      if (!skip && e.textContent.length) {
        yield e.textContent;
      }
    }
  }
}

client.on('ready', async ()=>{
  const channel = client.channels.get(config.channel);
  const chatLog = chat();
  for await (const msg of chatLog) {
    channel.send(msg);
  }
});
