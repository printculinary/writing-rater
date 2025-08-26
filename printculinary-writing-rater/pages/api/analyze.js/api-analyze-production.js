export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, writingType, criteria } = req.body;

    // Validation
    if (!text || !writingType || !criteria) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (text.length < 10) {
      return res.status(400).json({ error: 'Text must be at least 10 characters' });
    }

    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      console.error('Claude API key not configured');
      return res.status(500).json({ error: 'Service temporarily unavailable' });
    }

    // Prepare data
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    const charCount = text.length;
    const currentDate = new Date().toLocaleDateString();
    const sampleText = text.substring(0, 150);

    const prompt = `Analyze this ${writingType.toLowerCase()} and provide scores (1-10) with feedback:

TEXT: """${text}"""

Return ONLY valid JSON in this format:
{${criteria.map(c => `
  "${c}": {"score": [1-10], "feedback": "[specific feedback]"}`).join(',')},
  "overall": {"score": [1-10], "feedback": "[overall assessment]"},
  "writing_info": {
    "type": "${writingType}",
    "word_count": ${wordCount},
    "character_count": ${charCount},
    "analyzed_on": "${currentDate}",
    "sample_text": "${sampleText}${text.length > 150 ? '...' : ''}"
  }
}`;

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.content[0].text;
    
    // Clean and parse JSON
    let cleanedResponse = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    try {
      const result = JSON.parse(cleanedResponse);
      return res.status(200).json(result);
    } catch (parseError) {
      // Fallback parsing
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return res.status(200).json(result);
      }
      throw new Error('Could not parse response');
    }

  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ 
      error: 'Analysis failed. Please try again.',
      details: error.message 
    });
  }
}