const express = require('express');
const Review = require('../models/Review');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req,res) => {
  try {
    const data = await Review.find({approved:true,featured:true}).sort({createdAt:-1}).limit(30).lean();
    res.set('Cache-Control','public, max-age=60, stale-while-revalidate=300');
    res.json({ok:true,data});
  } catch { res.status(500).json({ok:false,error:'Could not load reviews.'}); }
});
router.get('/admin', requireAdmin, async (req,res) => {
  const data = await Review.find().sort({createdAt:-1}).lean();
  res.json({ok:true,data});
});
router.post('/', requireAdmin, async (req,res) => {
  try {
    const name=String(req.body?.name||'').trim(), text=String(req.body?.text||'').trim();
    if(name.length<2 || name.length>120 || text.length<3 || text.length>1200) return res.status(400).json({ok:false,error:'Name and review length are invalid.'});
    const data=await Review.create({name,role:String(req.body?.role||'Client').slice(0,120),rating:Math.min(5,Math.max(1,Number(req.body?.rating)||5)),text,featured:req.body?.featured!==false,approved:req.body?.approved===true});
    res.status(201).json({ok:true,data});
  } catch { res.status(500).json({ok:false,error:'Could not create review.'}); }
});
router.patch('/:id', requireAdmin, async (req,res) => {
  try {
    const update={};
    for(const key of ['name','role','text']) if(typeof req.body?.[key]==='string') update[key]=req.body[key].trim().slice(0,key==='text'?1200:120);
    if(req.body?.rating!==undefined) update.rating=Math.min(5,Math.max(1,Number(req.body.rating)||5));
    if(req.body?.approved!==undefined) update.approved=!!req.body.approved;
    if(req.body?.featured!==undefined) update.featured=!!req.body.featured;
    const data=await Review.findByIdAndUpdate(req.params.id,update,{new:true,runValidators:true}).lean();
    if(!data)return res.status(404).json({ok:false,error:'Review not found.'});
    res.json({ok:true,data});
  } catch { res.status(500).json({ok:false,error:'Could not update review.'}); }
});
router.delete('/:id', requireAdmin, async (req,res) => {
  try { const r=await Review.findByIdAndDelete(req.params.id); if(!r)return res.status(404).json({ok:false,error:'Review not found.'}); res.json({ok:true}); }
  catch { res.status(500).json({ok:false,error:'Could not delete review.'}); }
});
module.exports=router;
