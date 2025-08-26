import React, { useState, useEffect } from 'react';

const PrintCulinaryLogo = () => (
  <div className="flex flex-col items-center">
    <div className="text-6xl font-serif mb-2" style={{ color: '#DC9595' }}>
      <span className="relative">
        P
        <span className="absolute top-4 left-2 text-4xl">C</span>
      </span>
    </div>
    <div className="text-lg font-serif tracking-wider" style={{ color: '#DC9595' }}>
      PrintCulinary
    </div>
  </div>
);

export default function WritingRater() {
  const [inputText, setInputText] = useState('');
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('analyze');
  const [writingType, setWritingType] = useState('general');

  const writingTypes = {
    general: {
      name: 'General Writing',
      criteria: ['grammar', 'clarity', 'structure', 'style', 'engagement']
    },
    academic: {
      name: 'Academic Writing',
      criteria: ['grammar', 'clarity', 'structure', 'argumentation', 'citations', 'formality']
    },
    business: {
      name: 'Business Writing',
      criteria: ['grammar', 'clarity', 'conciseness', 'professionalism', 'actionability']
    },
    creative: {
      name: 'Creative Writing',
      criteria: ['grammar', 'creativity', 'voice', 'imagery', 'narrative_flow', 'engagement']
    }
  };

  const analyzeWriting = async () => {
    if (!inputText.trim()) {
      alert('Please enter some text to analyze.');
      return;
    }
    
    if (inputText.trim().length < 10) {
      alert('Please enter at least 10 characters for meaningful analysis.');
      return;
    }
    
    setIsLoading(true);
    
    const currentType = writingTypes[writingType];
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          writingType: currentType.name,
          criteria: currentType.criteria
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const analysisResult = await response.json();
      setCurrentAnalysis(analysisResult);
      
    } catch (error) {
      console.error("Error analyzing writing:", error);
      setCurrentAnalysis({
        error: `Analysis failed: ${error.message}. Please try again.`,
        writing_info: {
          type: currentType.name,
          word_count: inputText.split(/\s+/).filter(word => word.length > 0).length,
          character_count: inputText.length,
          analyzed_on: new Date().toLocaleDateString(),
          sample_text: inputText.substring(0, 150) + (inputText.length > 150 ? '...' : '')
        }
      });
    }
    
    setIsLoading(false);
  };

  const getScoreColor = (score) => {
    if (score >= 8) return "text-green-700 bg-green-100";
    if (score >= 6) return "text-amber-700 bg-amber-100";
    if (score >= 4) return "text-orange-700 bg-orange-100";
    return "text-red-700 bg-red-100";
  };

  const getScoreLabel = (score) => {
    if (score >= 9) return "Excellent";
    if (score >= 7) return "Good";
    if (score >= 5) return "Average";
    if (score >= 3) return "Needs Work";
    return "Poor";
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F0E4CC' }}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header with Logo */}
        <div className="text-center mb-8 relative">
          <div className="absolute top-0 right-0 opacity-30">
            <PrintCulinaryLogo />
          </div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-8 w-8 bg-current" style={{ color: '#DC9595' }}></div>
            <h1 className="text-3xl font-bold" style={{ color: '#DC9595' }}>
              Writing Rater by PrintCulinary
            </h1>
          </div>
          <p className="text-gray-700">Professional AI-powered writing analysis</p>
        </div>

        {/* Writing Type Selection */}
        <div className="bg-white rounded-lg p-4 border-2 mb-6" style={{ borderColor: '#DC9595' }}>
          <h3 className="font-medium mb-3" style={{ color: '#DC9595' }}>
            Select Writing Type:
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(writingTypes).map(([key, type]) => (
              <button
                key={key}
                onClick={() => setWritingType(key)}
                className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  writingType === key 
                    ? 'text-white border-transparent' 
                    : 'text-gray-700 hover:border-opacity-70'
                }`}
                style={writingType === key 
                  ? { backgroundColor: '#DC9595' } 
                  : { borderColor: '#DC9595' }
                }
              >
                <span className="text-sm font-medium">{type.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-lg p-6 shadow-lg border-2 mb-6" style={{ borderColor: '#DC9595' }}>
          <label htmlFor="writing-input" className="block text-sm font-medium text-gray-700 mb-2">
            Paste your {writingTypes[writingType].name.toLowerCase()} here for analysis:
          </label>
          <textarea
            id="writing-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full h-40 p-3 border-2 rounded-md focus:ring-2 focus:border-transparent resize-none"
            style={{ 
              borderColor: '#DC9595'
            }}
            placeholder={`Enter your ${writingTypes[writingType].name.toLowerCase()} here...`}
          />
          <div className="flex justify-between items-center mt-3">
            <span className="text-sm text-gray-600">
              {inputText.length} characters • {inputText.split(/\s+/).filter(word => word.length > 0).length} words
            </span>
            <button
              onClick={analyzeWriting}
              disabled={!inputText.trim() || isLoading}
              className="flex items-center gap-2 text-white px-4 py-2 rounded-md hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
              style={{ backgroundColor: '#DC9595' }}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  Analyze {writingTypes[writingType].name}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {currentAnalysis && (
          <div className="bg-white border-2 rounded-lg p-6 shadow-lg" style={{ borderColor: '#DC9595' }}>
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#DC9595' }}>
                {currentAnalysis.writing_info?.type || 'Writing'} Analysis Results
              </h2>
            </div>

            {currentAnalysis.error ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">{currentAnalysis.error}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Writing Info */}
                {currentAnalysis.writing_info && (
                  <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: '#F0E4CC' }}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div><span className="font-medium">Type:</span> {currentAnalysis.writing_info.type}</div>
                      <div><span className="font-medium">Words:</span> {currentAnalysis.writing_info.word_count}</div>
                      <div><span className="font-medium">Characters:</span> {currentAnalysis.writing_info.character_count}</div>
                      <div><span className="font-medium">Analyzed:</span> {currentAnalysis.writing_info.analyzed_on}</div>
                    </div>
                  </div>
                )}

                {/* Overall Score */}
                {currentAnalysis.overall && (
                  <div className="rounded-lg p-4 border-2" style={{ 
                    backgroundColor: '#F0E4CC', 
                    borderColor: '#DC9595' 
                  }}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold" style={{ color: '#DC9595' }}>
                        Overall Score
                      </h3>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(currentAnalysis.overall.score)}`}>
                        {currentAnalysis.overall.score}/10 • {getScoreLabel(currentAnalysis.overall.score)}
                      </div>
                    </div>
                    <p className="text-gray-800">{currentAnalysis.overall.feedback}</p>
                  </div>
                )}

                {/* Category Scores */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(currentAnalysis).filter(([key]) => 
                    key !== 'overall' && key !== 'error' && key !== 'writing_info' && key !== 'analysis_hash' && key !== '_meta'
                  ).map(([category, data]) => (
                    <div key={category} className="border-2 rounded-lg p-4 bg-white" style={{ borderColor: '#DC9595' }}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-medium text-gray-900 capitalize">{category.replace('_', ' ')}</h4>
                        <div className={`px-2 py-1 rounded text-sm font-medium ${getScoreColor(data.score || 0)}`}>
                          {data.score || 0}/10
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm">{data.feedback || 'No feedback available'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <span>Powered by</span>
            <div className="flex items-center gap-1">
              <div className="text-lg font-serif" style={{ color: '#DC9595' }}>PC</div>
              <span style={{ color: '#DC9595' }} className="font-medium">PrintCulinary</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}