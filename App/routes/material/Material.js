const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
require('dotenv').config();

const { SessionCheck } = require('../../controllers/userCommonFunctions');

router.use(express.json({ limit: '50mb' }));
router.use(express.urlencoded({ extended: true, limit: '50mb' }));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/material-substitution", async (req, res) => {
  try {
    // const Session = await SessionCheck(req, res);
    // if (Session) {
      const { material, context } = req.body;

      if (!material) {
        return res.status(400).json({ error: 'Material is required' });
      }

      // Build the prompt for OpenAI
      const prompt = `Suggest 3 alternatives to the construction material "${material}" used in ${context || 'a general construction project'}. 
      
      For each alternative, include:
      - Name of the material
      - Why it is a good substitute (cost, performance, sustainability)
      - Where it's commonly used
      
      Format your response as simple, clean HTML with styling. Don't include any HTML, HEAD or BODY tags. Use div elements with clean, modern styling for each alternative. Use a consistent color scheme.`;

      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          store: true,
          messages: [{ "role": 'user', "content": prompt }],
        //   temperature: 0.7
        });

        const suggestions = response.choices[0].message.content;
        res.json({ suggestions });
      } catch (error) {
        console.error('OpenAI API error:', error.message);
        res.status(500).json({ error: 'Failed to fetch suggestions from OpenAI' });
    //   }
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;