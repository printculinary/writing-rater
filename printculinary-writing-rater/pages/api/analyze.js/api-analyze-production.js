export default async function handler(req, res) {
  // Security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const { text, writingType, criteria } = req.body;

    // Input validation
    if (!text || !writingType || !criteria) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        code: 'MISSING_FIELDS' 
      });
    }

    if (text.length < 10) {
      return res.status(400).json({ 
        error: 'Text must be at least 10 characters long', 
        code: 'TEXT_TOO_SHORT' 
      });
    }

    if (text.length > 10000) {
      return res.status(400).json({ 
        error: 'Text too long. Maximum 10,000 characters.', 
        code: 'TEXT_TOO_LONG' 
      });
    }

    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      console.error('Claude API key not configured');
      return res.status(500).json({ 
        error: 'Service temporarily unavailable', 
        code: 'SERVICE_ERROR' 
      });
    }

    // Prepare analysis data
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    const charCount = text.length;
    const sampleText = text.substring(0, 150).replace(/"/g, '\\"');
    const currentDate = new Date().toLocaleDateString();

    const prompt = `Analyze this ${writingType.toLowerCase()} and provide detailed scores (1-10) with feedback:

TEXT: """${text}"""

TYPE: ${writingType}
CRITERIA: ${criteria.join(', ')}

Return ONLY valid JSON:
{${criteria.map(c => `
  "${c}": {"score": [1-10], "feedback": "[specific guidance]"}`).join(',')},
  "overall": {"score": [1-10], "feedback": "[summary and recommendations]"},
  "writing_info": {
    "type": "${writingType}",
    "word_count": ${wordCount},
    "character_count": ${charCount},
    "analyzed_on": "${currentDate}",
    "sample_text": "${sampleText}${text.length > 150 ? '...' : ''}"
  }
}`;

    // Call Claude API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!claudeResponse.ok) {
      if (claudeResponse.status === 429) {
        return res.status(429).json({ 
          error: 'Service busy. Please try again in a moment.', 
          code: 'RATE_LIMITED' 
        });
      }
      return res.status(500).json({ 
        error: 'Analysis service unavailable', 
        code: 'API_ERROR' 
      });
    }

    const claudeData = await claudeResponse.json();
    
    if (!claudeData.content?.[0]?.text) {
      return res.status(500).json({ 
        error: 'Invalid response from analysis service', 
        code: 'INVALID_RESPONSE' 
      });
    }

    // Parse response with fallbacks
    let responseText = claudeData.content[0].text;
    let cleanedResponse = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    
    let analysisResult;
    try {
      analysisResult = JSON.parse(cleanedResponse);
      
      if (!analysisResult.overall || !analysisResult.writing_info) {
        throw new Error('Missing required fields');
      }
      
    } catch (parseError) {
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          analysisResult = JSON.parse(jsonMatch[0]);
          if (!analysisResult.overall || !analysisResult.writing_info) {
            throw new Error('Incomplete analysis');
          }
        } catch (extractError) {
          return res.status(500).json({ 
            error: 'Could not process analysis results', 
            code: 'PARSE_ERROR' 
          });
        }
      } else {
        return res.status(500).json({ 
          error: 'Analysis format error', 
          code: 'FORMAT_ERROR' 
        });
      }
    }

    // Add metadata
    analysisResult._meta = {
      processed_at: new Date().toISOString(),
      version: '1.0.0',
      service: 'printculinary-ai'
    };

    return res.status(200).json(analysisResult);

  } catch (error) {
    console.error('Server error:', error);
    
    if (error.name === 'AbortError') {
      return res.status(408).json({ 
        error: 'Analysis timeout. Please try with shorter text.', 
        code: 'TIMEOUT' 
      });
    }
    
    return res.status(500).json({ 
      error: 'Internal server error', 
      code: 'SERVER_ERROR' 
    });
  }
}