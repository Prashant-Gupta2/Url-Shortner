const {nanoid} = require('nanoid');
const Url = require('../models/Url');
const dotenv = require('dotenv');
dotenv.config();

 const createShortUrl = async (req,res)=>{
   try{
    const { originalUrl } = req.body;

    if(!originalUrl){
        return res.status(400).json({error: 'Original URL is required'});  
    }
    let parseUrl;
    try{
      parseUrl = new URL(originalUrl);
    }
    catch(err){
      return res.status(400).json({error: "Invalid URL format"})    
    }
    if(parseUrl.protocol !== 'http:' && parseUrl.protocol !== 'https:'){
          return res.status(400).json({error: "Only http and https are required!"});
    }
    const shortCode = nanoid(6);

    const url = new Url({
          originalUrl,
          shortCode
    });
    await url.save();

    res.status(201).json({
          message: 'Short URL created',
          shortCode: url.shortCode,
          originalUrl: url.originalUrl
    })
   }
   catch(err){
    console.error(err);
    return res.status(500).json({error: 'Server error'});
   }
 }

 const redirectToOriginalUrl = async (req,res)=>{
      try{
       const { shortCode} = req.params;

        const url = await Url.findOne({shortCode: shortCode});
        if(!url){
            return res.status(404).json({error: "URL not found"});
        }
        url.clicks += 1;
        await url.save();

        return res.redirect(302, url.originalUrl);
      }  
      catch(err){
          console.log(err);
          return res.status(500).json({error: "Server error"});
      }  
 }

const getShortUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const url = await Url.findOne({ shortCode });

    if (!url) {
      return res.status(404).json({
        message: "Short URL not found"
      });
    }

    res.status(200).json({
      shortUrl: `${process.env.BASE_URL}/${url.shortCode}`,
      originalUrl: url.originalUrl
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error"
    });
  }
};

 module.exports ={
          createShortUrl,
          redirectToOriginalUrl,
          getShortUrl
 }