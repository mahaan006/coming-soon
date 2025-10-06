// pb_hooks/otp.js
console.log(">>> otp.js file loaded");

const OTP_TTL_MS = 10 * 60 * 1000;

function randCode(){ return (Math.floor(100000 + Math.random()*900000)).toString(); }

function readJson(c){
  try { const raw = new TextDecoder().decode(c.request.body()); return raw ? JSON.parse(raw) : {}; }
  catch { return {}; }
}

onBeforeServe((e)=>{
  console.log(">>> otp.js onBeforeServe called");
  e.router.add("POST","/send-email-otp",(c)=>{
    const { email: rawEmail } = readJson(c);
    const email=(rawEmail||"").trim().toLowerCase();
    if(!email) return c.json(400,{ok:false,error:"Email required"});
    return c.json(200,{ok:true,email});
  });
});
