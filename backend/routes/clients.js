const express = require('express');
const rateLimit = require('express-rate-limit');
const Client = require('../models/Client');
const { passwordHash, verifyPassword, signToken, requireAdmin, requireClient } = require('../middleware/auth');
const router = express.Router();

const clientLoginLimiter = rateLimit({ windowMs: 15*60*1000, max: 8, standardHeaders:'draft-7', legacyHeaders:false, message:{ok:false,error:'Too many login attempts. Please try again later.'} });

router.post('/login', clientLoginLimiter, async (req,res) => {
  try {
    const email=String(req.body?.email||'').trim().toLowerCase();
    const password=String(req.body?.password||'');
    const c=await Client.findOne({email});
    if(!c || !verifyPassword(password,c.passwordHash)) return res.status(401).json({ok:false,error:'Invalid client credentials.'});
    const token=signToken({role:'client',clientId:String(c._id),email:c.email},'client','12h');
    res.json({ok:true,token,client:{name:c.name,email:c.email}});
  } catch { res.status(500).json({ok:false,error:'Could not login.'}); }
});

router.get('/me', requireClient, async (req,res)=>{
  const c=await Client.findById(req.client.clientId).select('-passwordHash').lean();
  if(!c)return res.status(404).json({ok:false,error:'Client not found.'});
  res.json({ok:true,data:c});
});
router.get('/admin', requireAdmin, async(req,res)=>{const data=await Client.find().select('-passwordHash').sort({createdAt:-1}).lean();res.json({ok:true,data});});
router.post('/admin', requireAdmin, async(req,res)=>{
  try{
    const name=String(req.body?.name||'').trim(),email=String(req.body?.email||'').trim().toLowerCase(),password=String(req.body?.password||'');
    if(name.length<2||name.length>120||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<12)return res.status(400).json({ok:false,error:'Name, valid email and password (12+ chars) are required.'});
    const data=await Client.create({name,email,phone:String(req.body?.phone||'').slice(0,30),passwordHash:passwordHash(password),projects:[]});
    const safe=data.toObject();delete safe.passwordHash;res.status(201).json({ok:true,data:safe});
  }catch(e){if(e.code===11000)return res.status(409).json({ok:false,error:'A client with this email already exists.'});res.status(500).json({ok:false,error:'Could not create client.'});}
});
router.patch('/admin/:id', requireAdmin, async(req,res)=>{
  try{
    const update={};if(req.body?.name)update.name=String(req.body.name).trim().slice(0,120);if(req.body?.phone!==undefined)update.phone=String(req.body.phone).slice(0,30);if(req.body?.password)update.passwordHash=passwordHash(String(req.body.password));
    const c=await Client.findByIdAndUpdate(req.params.id,update,{new:true}).select('-passwordHash').lean();if(!c)return res.status(404).json({ok:false,error:'Client not found.'});res.json({ok:true,data:c});
  }catch{res.status(500).json({ok:false,error:'Could not update client.'});}
});
router.post('/admin/:id/projects', requireAdmin, async(req,res)=>{
  try{
    const rawUrl=String(req.body?.liveUrl||'').trim();
    if(rawUrl && !/^https:\/\//i.test(rawUrl)) return res.status(400).json({ok:false,error:'Live URL must use HTTPS.'});
    const project={name:String(req.body?.name||'').trim().slice(0,160),status:req.body?.status||'discovery',progress:Math.min(100,Math.max(0,Number(req.body?.progress)||0)),liveUrl:rawUrl.slice(0,500),milestones:Array.isArray(req.body?.milestones)?req.body.milestones.slice(0,20).map(m=>({label:String(m.label||'').slice(0,120),done:!!m.done})):[]};
    if(!project.name)return res.status(400).json({ok:false,error:'Project name required.'});
    const c=await Client.findByIdAndUpdate(req.params.id,{$push:{projects:project}},{new:true}).select('-passwordHash').lean();if(!c)return res.status(404).json({ok:false,error:'Client not found.'});res.status(201).json({ok:true,data:c});
  }catch{res.status(500).json({ok:false,error:'Could not create project.'});}
});
module.exports=router;
