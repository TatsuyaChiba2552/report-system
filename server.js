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
   LINE BOT
========================= */

const LINE_CHANNEL_ACCESS_TOKEN =
"Q2cTEV4oF1mbfcQQv8BTgn+7dW9Ahk891HvzlytD9ItLvIT58PtvAnjBm8tLbv+35fdGiK3xQyiQ1wE+9rhb4RNcMU2zRBG+Q6pypb/ALHyirrhq6/iLdLIqR5h0OSuTCpv/x83A7jjwPOpV6yLcqgdB04t89/1O/w1cDnyilFU=";

/*
ใส่ USER ID ของคนที่ต้องการรับแจ้งเตือน
ทุกคนต้อง:
- แอดบอท
- เคยส่งข้อความหาบอทแล้ว
*/

const LINE_USER_IDS = [

"U4758132c4676cefd0ed294d065bea8fb",
"Uadf0cca036b37a8a23e78f65a4588aac"

];


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

admins:[

{
name:"Admin1",
status:"🟢 ว่าง",
lastOnline:""
},

{
name:"Admin2",
status:"🟢 ว่าง",
lastOnline:""
},

{
name:"นาย ธีรศักดิ์ คำอินทร์ (นักศึกษาฝึกงาน)",
status:"🟢 ว่าง",
lastOnline:""
},

{
name:"นาย ชาคริต จันทร์ใหม่ (นักศึกษาฝึกงาน)",
status:"🟢 ว่าง",
lastOnline:""
},

{
name:"นาย ณรงค์พล อินต๊ะคำ (นักศึกษาฝึกงาน)",
status:"🟢 ว่าง",
lastOnline:""
}

]

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

if(
!LINE_CHANNEL_ACCESS_TOKEN ||
LINE_USER_IDS.length === 0
){

console.log("LINE NOT CONFIG");

return;

}

for(const userId of LINE_USER_IDS){

try{

const response = await fetch(
"https://api.line.me/v2/bot/message/push",
{

method:"POST",

headers:{

"Content-Type":"application/json",

"Authorization":
`Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`

},

body:JSON.stringify({

to:userId,

messages:[

{
type:"text",
text:message
}

]

})

});

const result =
await response.text();

console.log(
"LINE RESPONSE:",
result
);

}catch(err){

console.log(
"LINE ERROR:",
err
);

}

}

}


/* =========================
   SEND DISCORD
========================= */

async function sendDiscord(message){

if(!DISCORD_WEBHOOK){

console.log("DISCORD NOT CONFIG");

return;

}

try{

const response =
await fetch(DISCORD_WEBHOOK,{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

content:message

})

});

const result =
await response.text();

console.log(
"DISCORD RESPONSE:",
result
);

}catch(err){

console.log(
"DISCORD ERROR:",
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

await sendLine(msg);


/* DISCORD */

await sendDiscord(msg);


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

await sendLine(msg);

await sendDiscord(msg);

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

await sendLine(msg);

await sendDiscord(msg);

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
   LINE WEBHOOK
========================= */

app.post("/webhook",async(req,res)=>{

const events = req.body.events;

for(const event of events){

if(event.source?.userId){

console.log(
"LINE USER ID:",
event.source.userId
);

}

}

res.sendStatus(200);

});


/* =========================
   HOME
========================= */

app.get("/",(req,res)=>{

res.send("REPORT SYSTEM ONLINE");

});


/* =========================
   START
========================= */

app.listen(PORT,()=>{

console.log(
"Server running on port " + PORT
);

});
