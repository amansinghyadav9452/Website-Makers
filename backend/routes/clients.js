const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Client = require('../models/Client');
const router = express.Router();

function hashPassword(password, salt=crypto.randomBytes(16).toString('hex')) {
  const hash=crypto.scryptSync(password,salt,64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  const [salt,hash]=String(stored).split(':');
  if(!salt||!hash)return false;
  const test=crypto.scryptSync(password,salt,64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(test),Buffer.from(hash));
}
function admin(req,res,next){const h=req.get('authorization')||'';const t=h.startsWith('Bearer ')?h.slice(7):'';try{const p=jwt.verify(t,process.env.ADMIN_JWT_SECRET);if(p.role!=='admin')throw 0;req.admin=p;next()}catch{return res.status(401).json({ok:false,error:'Unauthorized.'})}}
function client(req,res,next){const h=req.get('authorization')||'';const t=h.startsWith('Bearer ')?h.slice(7):'';try{const p=jwt.verify(t,process.env.ADMIN_JWT_SECRET);if(p.role!=='client')throw 0;req.client=p;next()}catch{return res.status(401).json({ok:false,error:'Client session expired.'})}}

router.post('/login', async (req,res)=>{try{const email=String(req.body?.email||'').trim().toLowerCase(),password=String(req.body?.password||'');const c=await Client.findOne({email});if(!c||!verifyPassword(password,c.passwordHash))return res.status(401).json({ok:false,error:'Invalid client credentials.'});const token=jwt.sign({role:'client',clientId:String(c._id),email:c.email},process.env.ADMIN_JWT_SECRET,{expiresIn:'12h'});res.json({ok:true,token,client:{name:c.name,email:c.email}})}catch{res.status(500).json({ok:false,error:'Could not login.'})}});
router.get('/me',client,async(req,res)=>{const c=await Client.findById(req.client.clientId).select('-passwordHash').lean();if(!c)return res.status(404).json({ok:false,error:'Client not found.'});res.json({ok:true,data:c})});
router.get('/admin',admin,async(req,res)=>{const data=await Client.find().select('-passwordHash').sort({createdAt:-1}).lean();res.json({ok:true,data})});
router.post('/admin',admin,async(req,res)=>{try{const name=String(req.body?.name||'').trim(),email=String(req.body?.email||'').trim().toLowerCase(),password=String(req.body?.password||'');if(name.length<2||!email.includes('@')||password.length<8)return res.status(400).json({ok:false,error:'Name, valid email and password (8+ chars) are required.'});const data=await Client.create({name,email,phone:String(req.body?.phone||'').slice(0,30),passwordHash:hashPassword(password),projects:[]});const safe=data.toObject();delete safe.passwordHash;res.status(201).json({ok:true,data:safe})}catch(e){if(e.code===11000)return res.status(409).json({ok:false,error:'A client with this email already exists.'});res.status(500).json({ok:false,error:'Could not create client.'})}});
router.patch('/admin/:id',admin,async(req,res)=>{try{const update={};if(req.body?.name)update.name=String(req.body.name).trim().slice(0,120);if(req.body?.phone!==undefined)update.phone=String(req.body.phone).slice(0,30);if(req.body?.password)update.passwordHash=hashPassword(String(req.body.password));const c=await Client.findByIdAndUpdate(req.params.id,update,{new:true}).select('-passwordHash').lean();if(!c)return res.status(404).json({ok:false,error:'Client not found.'});res.json({ok:true,data:c})}catch{res.status(500).json({ok:false,error:'Could not update client.'})}});
router.post('/admin/:id/projects',admin,async(req,res)=>{try{const project={name:String(req.body?.name||'').trim().slice(0,160),status:req.body?.status||'discovery',progress:Math.min(100,Math.max(0,Number(req.body?.progress)||0)),liveUrl:String(req.body?.liveUrl||'').slice(0,500),milestones:Array.isArray(req.body?.milestones)?req.body.milestones.slice(0,20).map(m=>({label:String(m.label||'').slice(0,120),done:!!m.done})):[]};if(!project.name)return res.status(400).json({ok:false,error:'Project name required.'});const c=await Client.findByIdAndUpdate(req.params.id,{$push:{projects:project}},{new:true}).select('-passwordHash').lean();if(!c)return res.status(404).json({ok:false,error:'Client not found.'});res.status(201).json({ok:true,data:c})}catch{res.status(500).json({ok:false,error:'Could not create project.'})}});
module.exports=router;
