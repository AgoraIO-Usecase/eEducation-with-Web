import express from "express";
import bodyParser from "body-parser";
import cors from 'cors';

import Sentry from './components/sentry'
import {gateway as log} from './lib/logger'

require("dotenv").config();

const sentry = new Sentry(process.env.AGORA_APPID || '')
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
sentry.init();

app.get("/sentry", async (req, res) => {
  if (!sentry.online) {
    log.info('Initializing Sentry...')
    try {
      await sentry.init()
      log.info('Sentry initialized successfully')
    } catch(err) {
      log.error(`Sentry failed to initialize ${err}`)
    }
  }
  res.send(sentry.uid)
});

app.post("/simple_auth", async (req, res) => {
  const {cname, role} = req.body;
  const channelAttr = await sentry.cache.getAllChannelAttr(cname);
  if (channelAttr.teacherId && role === 2) {
    res.json({
      result: false,
      info: "Teacher already exists in this class"
    })
  }
})

app.get("/user/:uid", async (req, res) => {
  const uid = req.params.uid;
  const userAttr = await sentry.cache.getAllUserAttr(uid)
  res.send(`
    ${uid}: 
    ${JSON.stringify(userAttr)}
  `);
})

app.get("/channel/:cname", async (req, res) => {
  const cname = req.params.cname;
  const channelAttr = await sentry.cache.getAllChannelAttr(cname)
  const members = await sentry.cache.getChannelMembers(cname)
  res.send(`
    ${cname}:
    ${JSON.stringify(channelAttr)}
    ${JSON.stringify(members)} 
  `)
})

app.listen(process.env.SERVER_PORT, () =>
  console.log(`Example app listening on port ${process.env.SERVER_PORT}!`)
);





