import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { predictionAPI } from '@/lib/api';
import { 
  Eye, 
  Upload, 
  Brain, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  LogOut,
  UserPlus,
  Info,
  Zap,
  Image as ImageIcon,
  Target,
  Microscope
} from 'lucide-react';

interface PredictionResult {
  confidence_score: number;
  prediction_class: string;
  diagnosis: string;
  model_used?: string;
}

interface RETFoundPredictionResult {
  // Interpretación principal (binaria para screening)
  confidence_score: number;
  prediction_class: string;
  diagnosis: string;
  probabilities: Record<string, number>;
  
  // Interpretación detallada (clase individual más probable)
  individual_prediction: string;
  individual_confidence: number;
  individual_diagnosis: string;
  
  // Interpretación binaria explícita
  binary_prediction: string;
  binary_confidence: number;
  binary_diagnosis: string;
  
  // Recomendación clínica
  clinical_recommendation: string;
  
  // Información detallada (compatibilidad)
  detailed_class: string;
  detailed_probabilities: Record<string, number>;
  model_used: string;
  checkpoint_loaded: boolean;
}

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | RETFoundPredictionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<'current' | 'retfound'>('current');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    setSelectedFile(file);
    setPrediction(null);
    setSaveMessage(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    try {
      // Use the selected model for prediction
      const response = selectedModel === 'retfound' 
        ? await predictionAPI.predictRETFound(selectedFile)
        : await predictionAPI.predict(selectedFile);
      
      setPrediction(response.data);
      
      // Optionally save the prediction (only if patient exists)
      try {
        await predictionAPI.save({
          prediction_class: response.data.prediction_class,
          confidence_score: response.data.confidence_score,
        });
        setSaveMessage('Prediction saved to patient history');
      } catch (saveError) {
        // Show message about needing patient profile
        setSaveMessage('Create a patient profile to save predictions');
        console.warn('Could not save prediction (no patient profile):', saveError);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      processFile(file);
    }
  };

  // Type guard to check if prediction is RETFound result
  const isRETFoundResult = (pred: PredictionResult | RETFoundPredictionResult | null): pred is RETFoundPredictionResult => {
    return pred !== null && 'detailed_class' in pred;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-blue-50 flex">
      {/* Left Sidebar - Navigation */}
      <div className="w-64 bg-white/70 backdrop-blur-xl border-r border-white/20 flex flex-col fixed left-0 top-0 h-full z-40">
        {/* Logo & Brand */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 bg-white/70 ring-1 ring-blue-100">
              <Eye className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 tracking-[-0.01em]">RetinaScan AI</h1>
              <p className="text-sm text-slate-500">Professional Dashboard</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/60 text-slate-700 rounded-full flex items-center justify-center ring-1 ring-black/5">
              <span className="text-sm font-medium">{user?.username?.[0]?.toUpperCase()}</span>
            </div>
            <div>
              <p className="font-medium text-slate-900">{user?.username}</p>
              <p className="text-sm text-slate-500">Medical Professional</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-6">
          <div className="space-y-2">
            <div className="bg-white/70 border border-white/30 rounded-lg p-3 backdrop-blur-sm">
              <div className="flex items-center">
                <Brain className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-slate-900">AI Analysis</p>
                  <p className="text-xs text-slate-600">Active Module</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/patient-profile')}
              className="w-full flex items-center p-3 text-left hover:bg-gray-100 rounded-lg transition-colors"
            >
              <UserPlus className="h-5 w-5 text-gray-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Patient Profile</p>
                <p className="text-xs text-gray-500">Manage patient data</p>
              </div>
            </button>
            
            <div className="flex items-center p-3 text-gray-500">
              <FileText className="h-5 w-5 mr-3" />
              <div>
                <p className="font-medium">Clinical Reports</p>
                <p className="text-xs">Coming soon</p>
              </div>
            </div>
          </div>
        </nav>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200">
          <Button 
            onClick={logout}
            variant="ghost" 
            className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 ml-64 transition-all duration-300 ${prediction ? 'mr-96' : 'mr-0'}`}>
        <div className="p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-1 tracking-[-0.01em]">
              Welcome back, {user?.username}
            </h2>
            <p className="text-slate-600 text-base">
              AI-powered retinal analysis
            </p>
          </div>

          {/* Feature Cards - Apple Style */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/80 backdrop-blur-sm border border-white/40 ring-1 ring-black/5 rounded-xl p-5 hover:shadow-md transition-all">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mr-4">
                  <Brain className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">AI Analysis</p>
                  <p className="text-base font-semibold text-slate-900">Advanced</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm border border-white/40 ring-1 ring-black/5 rounded-xl p-5 hover:shadow-md transition-all">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mr-4">
                  <FileText className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Reports</p>
                  <p className="text-base font-semibold text-slate-900">Clinical</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm border border-white/40 ring-1 ring-black/5 rounded-xl p-5 hover:shadow-md transition-all">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mr-4">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Compliance</p>
                  <p className="text-base font-semibold text-slate-900">HIPAA</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Section - Full Width */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm border border-white/40 ring-1 ring-black/5 rounded-xl shadow-sm transition-all">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-md flex items-center justify-center mr-3">
                    <Upload className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Upload & Analysis</h3>
                    <p className="text-sm text-slate-500">Retinal fundus imaging</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {/* Model Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="model-select">Select AI Model</Label>
                    <Select value={selectedModel} onValueChange={(value: 'current' | 'retfound') => setSelectedModel(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="current">
                          <div className="flex items-center">
                            <Brain className="h-4 w-4 mr-2" />
                            Current Model (.h5) - Fast & Accurate
                          </div>
                        </SelectItem>
                        <SelectItem value="retfound">
                          <div className="flex items-center">
                            <Zap className="h-4 w-4 mr-2" />
                            RETFound Official - Research Grade
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <div 
                    onClick={handleUploadClick}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                      isDragOver 
                        ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-500/20' 
                        : 'border-slate-300 hover:border-blue-400 hover:bg-white/60'
                    }`}
                  >
                    {preview ? (
                      <div className="space-y-4">
                        <div className="relative inline-block">
                          <img 
                            src={preview} 
                            alt="Preview" 
                            className="max-h-48 mx-auto rounded-xl shadow-sm ring-1 ring-black/5"
                          />
                          <div className="absolute inset-0 rounded-xl"></div>
                        </div>
                        <div className="bg-white/70 rounded-md px-3 py-1.5 inline-block ring-1 ring-black/5">
                          <p className="text-sm text-slate-600">
                            {selectedFile?.name}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className={`w-16 h-16 rounded-xl mx-auto flex items-center justify-center ${
                          isDragOver ? 'bg-blue-500/10 ring-1 ring-blue-500/10' : 'bg-white/60 ring-1 ring-black/5'
                        }`}>
                          <Upload className={`h-8 w-8 ${isDragOver ? 'text-blue-600' : 'text-slate-600'}`} />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-slate-900 mb-1">
                            {isDragOver ? 'Drop your image here' : 'Upload retinal image'}
                          </p>
                          <p className="text-sm text-slate-600">
                            Drag & drop or click to browse
                          </p>
                          <p className="text-xs text-slate-500 mt-2">
                            JPG, PNG up to 10MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={handleAnalyze}
                    disabled={!selectedFile || isAnalyzing}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-md active:translate-y-[1px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-5 w-5" />
                        Start AI Analysis
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Results */}
      <div className={`fixed right-0 top-0 h-full w-96 bg-white/70 backdrop-blur-xl border-l border-white/20 z-50 transform transition-transform duration-300 ease-in-out ${
        prediction ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white/60 rounded-md flex items-center justify-center mr-3 ring-1 ring-black/5">
                <FileText className="h-4 w-4 text-slate-700" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Analysis Results</h3>
                <p className="text-sm text-slate-600">AI Diagnostic Report</p>
              </div>
            </div>
            <button 
              onClick={() => setPrediction(null)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {prediction ? (
            <div className="space-y-4">
              {/* Diagnosis */}
              <div className={`flex items-center justify-between p-4 rounded-xl ring-1 ring-black/5 ${
                prediction.prediction_class === 'DR' 
                  ? 'bg-red-50' 
                  : 'bg-green-50'
              }`}>
                <div className="flex items-center">
                  {prediction.prediction_class === 'DR' ? (
                    <AlertTriangle className="h-6 w-6 mr-3 text-red-600" />
                  ) : (
                    <CheckCircle className="h-6 w-6 mr-3 text-green-600" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{prediction.diagnosis}</p>
                    <p className="text-sm text-gray-600">
                      {prediction.prediction_class === 'DR' 
                        ? 'Recommend ophthalmologist consultation'
                        : 'No signs of diabetic retinopathy detected'
                      }
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={prediction.prediction_class === 'DR' ? 'destructive' : 'default'}
                  className="ml-4"
                >
                  {prediction.prediction_class}
                </Badge>
              </div>

              {/* Model Info & Confidence - Compact */}
               <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-white/30 ring-1 ring-black/5">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {prediction.confidence_score.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Confidence</div>
                  </div>
                </div>
                <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-white/30 ring-1 ring-black/5">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-900 mb-1">
                      {prediction.model_used || 'Current Model'}
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Model</div>
                  </div>
                </div>
              </div>

              {/* RETFound Dual Interpretation */}
              {isRETFoundResult(prediction) && (
                <div className="space-y-4">
                  {/* Clinical Analysis Section - Compact */}
                  <div className="bg-white/70 backdrop-blur-sm p-5 rounded-xl border border-white/30 ring-1 ring-black/5">
                    <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Microscope className="h-5 w-5 text-slate-600" />
                      Clinical Analysis
                    </h4>
                        
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {/* Individual Assessment */}
                      <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-white/30 ring-1 ring-black/5">
                        <div className="text-center mb-3">
                          <div className="text-lg font-semibold text-slate-800 mb-1">
                            {prediction.individual_confidence.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500">Confidence</div>
                        </div>
                        <div className="text-center">
                          <Badge variant="outline" className="text-xs">
                            {prediction.individual_prediction}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Binary Screening */}
                      <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-white/30 ring-1 ring-black/5">
                        <div className="text-center mb-3">
                          <div className="text-lg font-semibold text-slate-800 mb-1">
                            {prediction.binary_confidence.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500">Confidence</div>
                        </div>
                        <div className="text-center">
                          <Badge variant={prediction.binary_prediction === 'DR' ? 'destructive' : 'default'} className="text-xs">
                            {prediction.binary_prediction}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Recommendations Summary */}
                      <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-white/30 ring-1 ring-black/5">
                        <div className="text-center mb-3">
                          <div className="text-lg font-semibold text-slate-800 mb-1">
                            {prediction.clinical_recommendation.split(' | ').length}
                          </div>
                          <div className="text-xs text-gray-500">Actions</div>
                        </div>
                        <div className="text-center">
                          <Badge variant="outline" className="text-xs">
                            View Details
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Detailed Probabilities - Compact */}
                  <div className="bg-white/70 backdrop-blur-sm p-5 rounded-xl border border-white/30 ring-1 ring-black/5">
                    <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Target className="h-4 w-4 text-slate-600" />
                      DR Stage Probabilities
                    </h4>
                    <div className="grid grid-cols-5 gap-3">
                      {Object.entries(prediction.detailed_probabilities).map(([stage, prob]) => (
                        <div key={stage} className="text-center">
                          <div className="text-lg font-semibold text-slate-800 mb-1">
                            {prob.toFixed(1)}%
                          </div>
                          <div className="text-xs text-slate-500 leading-tight">
                            {stage.replace(' DR', '').replace('No ', '')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Save Status */}
              {saveMessage && (
                <Alert className={saveMessage.includes('saved') ? 'border-green-100 bg-green-50' : 'border-blue-100 bg-blue-50'}>
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 flex-shrink-0" />
                    <AlertDescription className="flex items-center justify-between flex-1">
                      <span>{saveMessage}</span>
                      {saveMessage.includes('Create') && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="ml-2"
                          onClick={() => navigate('/patient-profile')}
                        >
                          Create Profile
                        </Button>
                      )}
                    </AlertDescription>
                  </div>
                </Alert>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-gray-500" />
              </div>
              <p className="text-gray-600">
                Upload an image to see analysis results
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Results will appear here after analysis
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;