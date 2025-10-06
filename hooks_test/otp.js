// pb_hooks/otp.js

const OTP_TTL_MS = 10 * 60 * 1000;
function randCode(){ return (Math.floor(100000 + Math.random()*900000)).toString(); }

function readJson(c){
  try{ const raw = new TextDecoder().decode(c.request.body()); return raw ? JSON.parse(raw) : {}; }
  catch{ return {}; }
}

onBeforeServe((e)=>{
  console.log(">>> otp.js loaded from hooks_test (routes: /send-email-otp, /verify-email-otp)");

  e.router.add("POST","/send-email-otp",(c)=>{
    const { email: rawEmail } = readJson(c);
    const email = (rawEmail||"").trim().toLowerCase();
    if(!email) return c.json(400,{ok:false,error:"Email required"});

    const dao=$app.dao(); const coll=dao.findCollectionByNameOrId("email_otps");
    const code=randCode();
    try{
      let rec;
      try{ rec = dao.findFirstRecordByFilter(coll.id,"email = {:email}",{email}); rec.set("code",code); dao.saveRecord(rec); }
      catch{ rec = new Record(coll,{email,code}); dao.saveRecord(rec); }

      const msg=new MailMessage();
      msg.to=email; msg.subject="Your OTP Code";
      msg.text=`Your OTP code is ${code}. It expires in ${Math.round(OTP_TTL_MS/60000)} minutes.`;
      msg.html=`<p>Your OTP code is <b>${code}</b>. It expires in ${Math.round(OTP_TTL_MS/60000)} minutes.</p>`;
      $app.newMailClient().send(msg);

      return c.json(200,{ok:true,email});
    }catch(err){
      console.log("send-email-otp error:",err?.toString?.()??err);
      return c.json(500,{ok:false,error:"Mail send failed"});
    }
  });

  e.router.add("POST","/verify-email-otp",(c)=>{
    const { email:rawEmail, code:rawCode } = readJson(c);
    const email=(rawEmail||"").trim().toLowerCase();
    const code=(rawCode||"").trim();
    if(!email||!code) return c.json(400,{ok:false,error:"Email & code required"});

    try{
      const dao=$app.dao(); const coll=dao.findCollectionByNameOrId("email_otps");
      const rec=dao.findFirstRecordByFilter(coll.id,"email = {:email}",{email});
      if(rec.get("code")!==code) return c.json(400,{ok:false,error:"Invalid code"});

      const createdMs = new Date(rec.created).getTime();
      if(Number.isFinite(createdMs) && (Date.now()-createdMs>OTP_TTL_MS)){
        dao.deleteRecord(rec);
        return c.json(400,{ok:false,error:"Code expired"});
      }

      dao.deleteRecord(rec);
      return c.json(200,{ok:true});
    }catch{
      return c.json(400,{ok:false,error:"Code not found"});
    }
  });
});
