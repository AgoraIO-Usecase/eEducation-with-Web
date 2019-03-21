import express from "express";
import Sentry from './sentry'

require("dotenv").config();

const app = express();
const sentry = new Sentry(process.env.AGORA_APPID as string)

console.log(`Initializing sentry`)

sentry.init()
  .then(() => {
    console.log(`Initialized sentry`)
  })
  .catch(err => {
    console.log(`Failed to init sentry, `, err);
  })


app.get("/", (req, res) => res.send(sentry.uid));

app.get("/user/:uid", async (req, res) => {
  const uid = req.params.uid;
  const userAttr = await sentry.channelCacheClient.getAllUserAttr(uid)
  res.send(`
    ${uid}: 
    ${JSON.stringify(userAttr)}
  `);
})

app.get("/channel/:cname", async (req, res) => {
  const cname = req.params.cname;
  const channelAttr = await sentry.channelCacheClient.getAllChannelAttr(cname)
  const members = await sentry.channelCacheClient.getChannelMembers(cname)
  res.send(`
    ${cname}:
    ${JSON.stringify(channelAttr)}
    ${JSON.stringify(members)} 
  `)
})

app.listen(process.env.SERVER_PORT, () =>
  console.log(`Example app listening on port ${process.env.SERVER_PORT}!`)
);





