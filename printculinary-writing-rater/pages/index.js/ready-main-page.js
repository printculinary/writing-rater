import React, { useState, useEffect } from 'react';
import { Send, FileText, BarChart3, Save, History, GitCompare, Download, Trash2, BookOpen, Briefcase, PenTool } from 'lucide-react';

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
  const [selectedForCompare, setSelectedForCompare] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('printculinary_analyses');
      if (saved) {
        const parsed = JSON.parse(saved);
        setAnalysisHistory(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Error loading analysis history:', error);
      setAnalysisHistory([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('printculinary_analyses', JSON.stringify(analysisHistory));
    } catch (error) {
      console.error('Error saving analysis history:', error);
    }
  }, [analysisHistory]);

  const writingTypes = {
    general: {
      name: 'General Writing',
      icon: <FileText className="h-4 w-4" />,
      criteria: ['grammar', 'clarity', 'structure', 'style', 'engagement']
    },
    academic: {
      name: 'Academic Writing',
      icon: <BookOpen className="h-4 w-4" />,
      criteria: ['grammar', 'clarity', 'structure', 'argumentation', 'citations', 'formality']
    },
    business: {
      name: 'Business Writing',
      icon: <Briefcase className="h-4 w-4" />,
      criteria: ['grammar', 'clarity', 'conciseness', 'professionalism', 'actionability']
    },
    creative: {
      name: 'Creative Writing',
      icon: <PenTool className="h-4 w-4" />,
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

  const saveAnalysis = () => {
    if (!currentAnalysis || currentAnalysis.error) {
      alert('No valid analysis to save.');
      return;
    }
    
    if (!currentAnalysis.overall || !currentAnalysis.writing_info) {
      alert('Analysis is incomplete. Please run a new analysis.');
      return;
    }
    
    try {
      const analysisHash = btoa(Date.now().toString() + Math.random().toString()).substring(0, 12);
      
      const analysisToSave = {
        ...currentAnalysis,
        analysis_hash: analysisHash
      };
      
      setAnalysisHistory(prev => {
        const newHistory = [analysisToSave, ...prev];
        return newHistory.slice(0, 50);
      });
      
      alert('Analysis saved to history!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save analysis. Please try again.');
    }
  };

  const deleteAnalysis = (analysisHash) => {
    if (!analysisHash) {
      alert('Cannot delete: invalid analysis.');
      return;
    }
    
    if (confirm('Are you sure you want to delete this analysis?')) {
      try {
        setAnalysisHistory(prev => prev.filter(analysis => analysis.analysis_hash !== analysisHash));
        setSelectedForCompare(prev => prev.filter(hash => hash !== analysisHash));
      } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete analysis. Please try again.');
      }
    }
  };

  const loadAnalysis = (analysis) => {
    if (!analysis || !analysis.writing_info) {
      alert('Cannot load: invalid analysis data.');
      return;
    }
    
    try {
      setCurrentAnalysis(analysis);
      setActiveTab('analyze');
      
      const foundType = Object.keys(writingTypes).find(key => 
        writingTypes[key].name === analysis.writing_info.type
      );
      setWritingType(foundType || 'general');
      
      setInputText('');
    } catch (error) {
      console.error('Load error:', error);
      alert('Failed to load analysis. Please try again.');
    }
  };

  const toggleCompareSelection = (analysisHash) => {
    if (!analysisHash) return;
    
    try {
      if (selectedForCompare.includes(analysisHash)) {
        setSelectedForCompare(prev => prev.filter(hash => hash !== analysisHash));
      } else if (selectedForCompare.length < 3) {
        setSelectedForCompare(prev => [...prev, analysisHash]);
      } else {
        alert('You can compare a maximum of 3 analyses at once.');
      }
    } catch (error) {
      console.error('Compare toggle error:', error);
    }
  };

  const exportHistory = () => {
    if (analysisHistory.length === 0) {
      alert('No analyses to export.');
      return;
    }
    
    try {
      const dataStr = JSON.stringify(analysisHistory, null, 2);
      const dataBlob = new Blob([dataStr], {type: 'application/json'});
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `printculinary_analyses_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
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

  const renderComparisonView = () => {
    try {
      const selectedAnalyses = analysisHistory.filter(analysis => 
        analysis.analysis_hash && selectedForCompare.includes(analysis.analysis_hash)
      );
      
      if (selectedAnalyses.length === 0) {
        return (
          <div className="text-center py-8 bg-white rounded-lg border-2" style={{ borderColor: '#DC9595' }}>
            <GitCompare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Select analyses from the History tab to compare them here.</p>
          </div>
        );
      }
      
      if (selectedAnalyses.length === 1) {
        return (
          <div className="text-center py-8 bg-white rounded-lg border-2" style={{ borderColor: '#DC9595' }}>
            <GitCompare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Select at least one more analysis to start comparing.</p>
            <p className="text-sm text-gray-500 mt-2">
              Currently selected: {selectedAnalyses[0].writing_info?.type || 'Analysis'}
            </p>
          </div>
        );
      }

      const allCriteria = new Set();
      selectedAnalyses.forEach(analysis => {
        Object.keys(analysis).forEach(key => {
          if (key !== 'writing_info' && key !== 'overall' && key !== 'error' && 
              key !== 'analysis_hash' && analysis[key] && 
              typeof analysis[key] === 'object' && 
              typeof analysis[key].score === 'number') {
            allCriteria.add(key);
          }
        });
      });

      return (
        <div className="space-y-6">
          <h3 className="text-xl font-bold" style={{ color: '#DC9595' }}>
            Comparing {selectedAnalyses.length} Writing Analyses
          </h3>
          
          <div className="bg-white rounded-lg p-4 border-2" style={{ borderColor: '#DC9595' }}>
            <h4 className="font-semibold mb-4" style={{ color: '#DC9595' }}>Overall Scores</h4>
            <div className="grid gap-4">
              {selectedAnalyses.map(analysis => (
                <div key={analysis.analysis_hash} className="flex justify-between items-center p-3 rounded" style={{ backgroundColor: '#F0E4CC' }}>
                  <div>
                    <span className="font-medium">{analysis.writing_info?.type || 'Writing Analysis'}</span>
                    <div className="text-sm text-gray-600">{analysis.writing_info?.analyzed_on || 'Unknown Date'}</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(analysis.overall?.score || 0)}`}>
                    {analysis.overall?.score || 0}/10
                  </div>
                </div>
              ))}
            </div>
          </div>

          {Array.from(allCriteria).map(criterion => (
            <div key={criterion} className="bg-white rounded-lg p-4 border-2" style={{ borderColor: '#DC9595' }}>
              <h4 className="font-semibold mb-4 capitalize" style={{ color: '#DC9595' }}>
                {criterion.replace('_', ' ')} Comparison
              </h4>
              <div className="space-y-3">
                {selectedAnalyses.map(analysis => (
                  analysis[criterion] && analysis[criterion].score !== undefined && (
                    <div key={analysis.analysis_hash} className="flex justify-between items-start p-3 rounded" style={{ backgroundColor: '#F0E4CC' }}>
                      <div className="flex-1">
                        <div className="font-medium">{analysis.writing_info?.type || 'Analysis'}</div>
                        <div className="text-sm text-gray-700 mt-1">{analysis[criterion].feedback || 'No feedback available'}</div>
                      </div>
                      <div className={`px-2 py-1 rounded text-sm font-medium ml-4 ${getScoreColor(analysis[criterion].score)}`}>
                        {analysis[criterion].score}/10
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    } catch (error) {
      console.error('Comparison render error:', error);
      return (
        <div className="text-center py-8 bg-white rounded-lg border-2" style={{ borderColor: '#DC9595' }}>
          <p className="text-red-600">Error displaying comparison. Please try again.</p>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F0E4CC' }}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header with Logo and Watermark */}
        <div className="text-center mb-8 relative">
          <div className="absolute top-0 right-0 opacity-30">
            <PrintCulinaryLogo />
          </div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="h-8 w-8" style={{ color: '#DC9595' }} />
            <h1 className="text-3xl font-bold" style={{ color: '#DC9595' }}>
              Writing Rater by PrintCulinary
            </h1>
          </div>
          <p className="text-gray-700">Professional AI-powered writing analysis</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-lg p-1 border-2" style={{ borderColor: '#DC9595' }}>
            <button
              onClick={() => setActiveTab('analyze')}
              className={`px-4 py-2 rounded-md transition-all ${
                activeTab === 'analyze' 
                  ? 'text-white' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              style={activeTab === 'analyze' ? { backgroundColor: '#DC9595' } : {}}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Analyze
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-md transition-all ${
                activeTab === 'history' 
                  ? 'text-white' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              style={activeTab === 'history' ? { backgroundColor: '#DC9595' } : {}}
            >
              <History className="h-4 w-4 inline mr-2" />
              History ({analysisHistory.length})
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={`px-4 py-2 rounded-md transition-all ${
                activeTab === 'compare' 
                  ? 'text-white' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              style={activeTab === 'compare' ? { backgroundColor: '#DC9595' } : {}}
            >
              <GitCompare className="h-4 w-4 inline mr-2" />
              Compare ({selectedForCompare.length})
            </button>
          </div>
        </div>

        {/* Analyze Tab */}
        {activeTab === 'analyze' && (
          <div className="space-y-6">
            {/* Writing Type Selection */}
            <div className="bg-white rounded-lg p-4 border-2" style={{ borderColor: '#DC9595' }}>
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
                    {type.icon}
                    <span className="text-sm font-medium">{type.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Section */}
            <div className="bg-white rounded-lg p-6 shadow-lg border-2" style={{ borderColor: '#DC9595' }}>
              <label htmlFor="writing-input" className="block text-sm font-medium text-gray-700 mb-2">
                Paste your {writingTypes[writingType].name.toLowerCase()} here for analysis:
              </label>
              <textarea
                id="writing-input"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full h-40 p-3 border-2 rounded-md focus:ring-2 focus:border-transparent resize-none"
                style={{ 
                  borderColor: '#DC9595',
                  focusRingColor: '#DC9595'
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
                      <BarChart3 className="h-4 w-4" />
                      Analyze {writingTypes[writingType].name}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results Section */}
            {currentAnalysis && (
              <div className="bg-white border-2 rounded-lg p-6 shadow-lg" style={{ borderColor: '#DC9595' }}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-6 w-6" style={{ color: '#DC9595' }} />
                    <h2 className="text-2xl font-bold" style={{ color: '#DC9595' }}>
                      {currentAnalysis.writing_info?.type || 'Writing'} Analysis Results
                    </h2>
                  </div>
                  {!currentAnalysis.error && currentAnalysis.overall && (
                    <button
                      onClick={saveAnalysis}
                      className="flex items-center gap-1 px-3 py-2 text-white rounded-md text-sm hover:opacity-90"
                      style={{ backgroundColor: '#DC9595' }}
                    >
                      <Save className="h-4 w-4" />
                      Save to History
                    </button>
                  )}
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
                      {Object.entries(currentAnalysis).filter(([key]) => key !== 'overall' && key !== 'error' && key !== 'writing_info' && key !== 'analysis_hash' && key !== '_meta').map(([category, data]) => (
                        <div key={category} className="border-2 rounded-lg p-4 bg-white" style={{ borderColor: '#DC9595' }}>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-lg font-medium text-gray-900 capitalize">{category.replace('_', ' ')}</h4>
                            <div className={`px-2 py-1 rounded text-sm font-medium ${getScoreColor(data.score)}`}>
                              {data.score}/10
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm">{data.feedback}</p>
                        </div>
                      ))}
                    </div>

                    {/* Score Summary */}
                    <div className="rounded-lg p-4" style={{ backgroundColor: '#F0E4CC' }}>
                      <h4 className="font-medium mb-3" style={{ color: '#DC9595' }}>
                        Score Breakdown
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        {Object.entries(currentAnalysis).filter(([key]) => key !== 'error' && key !== 'writing_info' && key !== 'analysis_hash' && key !== '_meta' && currentAnalysis[key]?.score !== undefined).map(([category, data]) => (
                          <div key={category} className="flex justify-between">
                            <span className="text-gray-700 capitalize">{category.replace('_', ' ')}:</span>
                            <span className="font-medium" style={{ color: '#DC9595' }}>{data.score}/10</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {