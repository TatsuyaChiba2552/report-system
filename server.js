import express from "express";
import cors from "cors";
import fs from "fs-extra";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const DB_FILE = "./db.json";


/* =========================
   LINE TOKEN
========================= */

const LINE_TOKEN =
"Q2cTEV4oF1mbfcQQv8BTgn+7dW9Ahk891HvzlytD9ItLvIT58PtvAnjBm8tLbv+35fdGiK3xQyiQ1wE+9rhb4RNcMU2zRBG+Q6pypb/ALHyirrhq6/iLdLIqR5h0OSuTCpv/x83A7jjwPOpV6yLcqgdB04t89/1O/w1cDnyilFU=";


/* =========================
   DISCORD WEBHOOK
========================= */

const DISCORD_WEBHOOK =
"https://discord.com/api/webhooks/1506876755577929810/NaRG_f8-mln2ZvsSGgAJCl4azBmzTdD9ufBGzULS1hLAQ202DqEJdra4KBeGNJ7aRxYd";



/* =========================
   CREATE DB
========================= */

if(!fs.existsSync(DB_FILE)){

fs.writeJsonSync(DB_FILE,{
reports:[],
admins:[]
});

}


/* =========================
   READ DB
========================= */

async function readDB(){

return await fs.readJson(DB_FILE);

}


/* =========================
   WRITE DB
========================= */

async function writeDB(data){

await fs.writeJson(
DB_FILE,
data,
{ spaces:2 }
);

}


/* =========================
   SEND LINE
========================= */

async function sendLine(message){

if(!LINE_TOKEN) return;

try{

await fetch(
"https://notify-api.line.me/api/notify",
{

method:"POST",

headers:{
"Content-Type":
"application/x-www-form-urlencoded",

"Authorization":
`Bearer ${LINE_TOKEN}`
},

body:
`message=${encodeURIComponent(message)}`

});

}catch(err){

console.log(
"LINE ERROR",
err
);

}

}


/* =========================
   SEND DISCORD
========================= */

async function sendDiscord(message){

if(!DISCORD_WEBHOOK) return;

try{

await fetch(DISCORD_WEBHOOK,{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

content:message

})

});

}catch(err){

console.log(
"DISCORD ERROR",
err
);

}

}


/* =========================
   GET REPORTS
========================= */

app.get("/reports",async(req,res)=>{

const db =
await readDB();

res.json(db.reports);

});


/* =========================
   SEND REPORT
========================= */

app.post("/report",async(req,res)=>{

const db =
await readDB();

const report = {

id:Date.now(),

name:req.body.name,

room:req.body.room,

problem:req.body.problem,

status:"🟡 รอดำเนินการ",

admin:null

};

db.reports.push(report);

await writeDB(db);


/* =========================
   MESSAGE
========================= */

const msg =

`📢 มีงานแจ้งปัญหาใหม่

👤 ผู้แจ้ง: ${report.name}

🏠 ห้อง: ${report.room}

📝 ปัญหา:
${report.problem}`;


/* LINE */

sendLine(msg);


/* DISCORD */

sendDiscord(msg);


res.json(report);

});


/* =========================
   ACCEPT JOB
========================= */

app.post("/accept",async(req,res)=>{

const db =
await readDB();

const report =
db.reports.find(
r=>r.id == req.body.id
);

if(report){

report.status =
"🟢 กำลังดำเนินการ";

report.admin =
req.body.admin;


/* แจ้งเตือน */

const msg =

`✅ มีแอดมินรับงานแล้ว

👨‍💻 แอดมิน:
${req.body.admin}

👤 ผู้แจ้ง:
${report.name}

🏠 ห้อง:
${report.room}`;

sendLine(msg);

sendDiscord(msg);

}

await writeDB(db);

res.json({
success:true
});

});


/* =========================
   FINISH JOB
========================= */

app.post("/finish",async(req,res)=>{

const db =
await readDB();

const report =
db.reports.find(
r=>r.id == req.body.id
);

if(report){

const msg =

`🎉 งานเสร็จแล้ว

👤 ผู้แจ้ง:
${report.name}

🏠 ห้อง:
${report.room}

👨‍💻 ผู้ดำเนินการ:
${req.body.admin}`;

sendLine(msg);

sendDiscord(msg);

}


db.reports =
db.reports.filter(
r=>r.id != req.body.id
);

await writeDB(db);

res.json({
success:true
});

});


/* =========================
   GET ADMINS
========================= */

app.get("/admins",async(req,res)=>{

const db =
await readDB();

res.json(db.admins);

});


/* =========================
   UPDATE ADMIN STATUS
========================= */

app.post("/admin-status",async(req,res)=>{

const db =
await readDB();

const {
name,
status
} = req.body;


const admin =
db.admins.find(
a=>a.name === name
);

if(admin){

admin.status =
status;

admin.lastOnline =
new Date()
.toLocaleTimeString("th-TH");

}

await writeDB(db);

res.json({
success:true
});

});


/* =========================
   START
========================= */

app.listen(PORT,()=>{

console.log(
"Server running on port " + PORT
);

});
