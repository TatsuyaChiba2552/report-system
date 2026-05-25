const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;


/* =========================
   TOKENS
========================= */

const LINE_TOKEN =
"Q2cTEV4oF1mbfcQQv8BTgn+7dW9Ahk891HvzlytD9ItLvIT58PtvAnjBm8tLbv+35fdGiK3xQyiQ1wE+9rhb4RNcMU2zRBG+Q6pypb/ALHyirrhq6/iLdLIqR5h0OSuTCpv/x83A7jjwPOpV6yLcqgdB04t89/1O/w1cDnyilFU=";

const DISCORD_WEBHOOK =
"https://discord.com/api/webhooks/1506876755577929810/NaRG_f8-mln2ZvsSGgAJCl4azBmzTdD9ufBGzULS1hLAQ202DqEJdra4KBeGNJ7aRxYd";


/* =========================
   DATA
========================= */

let reports = [];

let admins = [];


/* =========================
   LINE NOTIFY
========================= */

async function sendLine(message){

try{

await fetch(
"https://api.line.me/v2/bot/message/broadcast",
{
method:"POST",

headers:{
"Content-Type":"application/json",
"Authorization":
"Bearer " + LINE_TOKEN
},

body:JSON.stringify({

messages:[
{
type:"text",
text:message
}
]

})

});

console.log("LINE SENT");

}catch(err){

console.log("LINE ERROR");
console.log(err);

}

}


/* =========================
   DISCORD NOTIFY
========================= */

async function sendDiscord(message){

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

console.log("DISCORD SENT");

}catch(err){

console.log("DISCORD ERROR");
console.log(err);

}

}


/* =========================
   SEND BOTH
========================= */

async function sendNotify(message){

await sendLine(message);

await sendDiscord(message);

}


/* =========================
   GET REPORTS
========================= */

app.get("/reports",(req,res)=>{

res.json(reports);

});


/* =========================
   SEND REPORT
========================= */

app.post("/report",async(req,res)=>{

const {
name,
room,
problem
} = req.body;

const report = {

id:Date.now(),

name,
room,
problem,

status:"🟡 รอดำเนินการ",

admin:null

};

reports.push(report);


/* แจ้งเตือน */

await sendNotify(

`📢 มีงานใหม่เข้ามา

👤 ผู้แจ้ง: ${name}

🏠 ห้อง: ${room}

🛠 ปัญหา:
${problem}`

);


res.json({
success:true,
id:report.id
});

});


/* =========================
   ACCEPT JOB
========================= */

app.post("/accept",async(req,res)=>{

const {
id,
admin
} = req.body;

const report =
reports.find(r=>r.id == id);

if(report){

report.status =
"🟢 กำลังดำเนินการ";

report.admin =
admin;


/* แจ้งเตือน */

await sendNotify(

`✅ มีแอดมินรับงานแล้ว

👨‍🔧 ${admin}

👤 ${report.name}

🏠 ห้อง ${report.room}`

);

}

res.json({
success:true
});

});


/* =========================
   FINISH JOB
========================= */

app.post("/finish",async(req,res)=>{

const {
id,
admin
} = req.body;

const index =
reports.findIndex(
r=>r.id == id
);

if(index !== -1){

const report =
reports[index];


/* แจ้งเตือน */

await sendNotify(

`🎉 งานเสร็จแล้ว

👨‍🔧 ${admin}

👤 ${report.name}

🏠 ห้อง ${report.room}`

);

reports.splice(index,1);

}

res.json({
success:true
});

});


/* =========================
   ADMIN STATUS
========================= */

app.post("/admin-status",(req,res)=>{

const {
name,
status
} = req.body;

const time =
new Date()
.toLocaleTimeString("th-TH");

const found =
admins.find(
a=>a.name === name
);

if(found){

found.status = status;
found.lastOnline = time;

}else{

admins.push({

name,
status,
lastOnline:time

});

}

res.json({
success:true
});

});


/* =========================
   GET ADMINS
========================= */

app.get("/admins",(req,res)=>{

res.json(admins);

});


/* =========================
   START SERVER
========================= */

app.listen(PORT,()=>{

console.log(
"SERVER RUNNING : " + PORT
);

});
