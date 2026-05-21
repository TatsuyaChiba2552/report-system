const express = require("express");
const fs = require("fs-extra");
const cors = require("cors");
const fetch = (...args)=>
import("node-fetch")
.then(({default:fetch})=>fetch(...args));

const app = express();

app.use(cors());
app.use(express.json());

const DB_FILE = "db.json";

const DISCORD_WEBHOOK =
"https://discord.com/api/webhooks/1506876755577929810/NaRG_f8-mln2ZvsSGgAJCl4azBmzTdD9ufBGzULS1hLAQ202DqEJdra4KBeGNJ7aRxYd";


// โหลด DB
function loadDB(){

return fs.readJsonSync(DB_FILE);

}


// บันทึก DB
function saveDB(data){

fs.writeJsonSync(DB_FILE,data,{
spaces:2
});

}


// Discord
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

}catch(error){

console.log(error);

}

}


// โหลดงาน
app.get("/reports",(req,res)=>{

const db = loadDB();

res.json(db.reports);

});


// โหลดแอดมิน
app.get("/admins",(req,res)=>{

const db = loadDB();

res.json(db.admins);

});


// แจ้งปัญหา
app.post("/report",async(req,res)=>{

const db = loadDB();

const report = {

id:Date.now(),

name:req.body.name,

room:req.body.room,

problem:req.body.problem,

status:"🟡 รอดำเนินการ",

admin:""

};

db.reports.push(report);

saveDB(db);


await sendDiscord(

`📢 แจ้งปัญหาใหม่

👤 ${report.name}

🏫 ห้อง ${report.room}

🛠 ${report.problem}`

);


res.json({
success:true
});

});


// รับงาน
app.post("/accept",async(req,res)=>{

const db = loadDB();

const report =
db.reports.find(
r=>r.id==req.body.id
);

if(report){

report.status =
"🟢 กำลังดำเนินการ";

report.admin =
req.body.admin;


// เปลี่ยนสถานะแอดมิน
const admin =
db.admins.find(
a=>a.name==req.body.admin
);

if(admin){

admin.status =
"🔴 ไม่ว่าง";

admin.lastOnline =
new Date().toLocaleString("th-TH");

}


saveDB(db);


await sendDiscord(

`🛠 รับงานแล้ว

👨‍🔧 ${req.body.admin}

🏫 ห้อง ${report.room}

📋 ${report.problem}`

);

}


res.json({
success:true
});

});


// งานเสร็จ
app.post("/finish",async(req,res)=>{

const db = loadDB();

const report =
db.reports.find(
r=>r.id==req.body.id
);


// ลบงาน
db.reports =
db.reports.filter(
r=>r.id!=req.body.id
);


// เปลี่ยนกลับว่าง
const admin =
db.admins.find(
a=>a.name==req.body.admin
);

if(admin){

admin.status =
"🟢 ว่าง";

admin.lastOnline =
new Date().toLocaleString("th-TH");

}


saveDB(db);


await sendDiscord(

`✅ งานเสร็จ

👨‍🔧 ${req.body.admin}

🏫 ห้อง ${report.room}`

);


res.json({
success:true
});

});


// เปลี่ยนสถานะเอง
app.post("/admin-status",(req,res)=>{

const db = loadDB();

const admin =
db.admins.find(
a=>a.name==req.body.name
);

if(admin){

admin.status =
req.body.status;

admin.lastOnline =
new Date().toLocaleString("th-TH");

saveDB(db);

}


res.json({
success:true
});

});


app.listen(3000,()=>{

console.log(
"Server Running"
);

});