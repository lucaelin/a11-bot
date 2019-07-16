const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const config = require('./config.json');

const Discord = require('discord.js');
const client = new Discord.Client();
client.login(config.token);


const names = require('./names.json');
const launch = new Date('2019-07-16T13:32:00.000Z');

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

async function* chat(defaultSkip = true) {
  const options = {};
  const dom  = await JSDOM.fromFile(config.source, options);
  const body = dom.window.document.body;
  const view = dom.window.document.defaultView;

  let skip = true;
  let currentSpeaker = names['CC'];
  for(const e of body.childNodes) {
    const text = e.textContent.trim();
    if (!text.length) continue;
    const res = /^(\d\d \d\d \d\d \d\d)$/.exec(text);
    if(res !== null) {
      skip = false;
      await waitFor(res[1], launch).catch(()=>{
        skip = defaultSkip;
      });
    } else {
      if (e instanceof view.HTMLFontElement) {
        currentSpeaker = names[text] || text;
      } else if (!skip) {
        yield [currentSpeaker, text];
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