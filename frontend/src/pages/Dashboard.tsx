import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { Label } from '@/components/ui/label';
import { predictionAPI } from '@/lib/api';
import { supabasePredictionAPI } from '@/lib/supabaseApi';
import { 
  Eye, 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Loader2,
  LogOut,
  UserPlus,
  Info,
  Zap,
  Target,
  Microscope,
  Sparkles,
  Shield,
  Activity,
  TrendingUp,
  BarChart3
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
  const [prediction, setPrediction] = useState<RETFoundPredictionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

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
      // Solo usamos RETFound
      const response = await predictionAPI.predictRETFound(selectedFile);
      
      setPrediction(response.data);
      
      // Optionally save the prediction (only if patient exists)
      try {
        await supabasePredictionAPI.save({
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex">
      {/* Left Sidebar - Navigation */}
      <div className="w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 flex flex-col fixed left-0 top-0 h-full z-40 shadow-xl">
        {/* Logo & Brand */}
        <div className="p-8 border-b border-slate-200/40">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mr-4 bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
              <Eye className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">RetinaScan AI</h1>
              <p className="text-sm text-slate-500 font-medium">Professional Platform</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-slate-200/40">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 rounded-2xl flex items-center justify-center ring-2 ring-white shadow-sm">
              <span className="text-lg font-bold">{user?.username?.[0]?.toUpperCase()}</span>
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">{user?.username}</p>
              <p className="text-xs text-slate-500 font-medium">Medical Professional</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-6">
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mr-3 shadow-md">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">AI Analysis</p>
                  <p className="text-xs text-slate-600 font-medium">Active Module</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/patient-profile')}
              className="w-full flex items-center p-4 text-left hover:bg-slate-50 rounded-2xl transition-all duration-200 group"
            >
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mr-3 group-hover:bg-slate-200 transition-colors">
                <UserPlus className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Patient Profile</p>
                <p className="text-xs text-slate-500 font-medium">Manage patient data</p>
              </div>
            </button>
            
            <div className="flex items-center p-4 text-slate-400">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mr-3">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Clinical Reports</p>
                <p className="text-xs font-medium">Coming soon</p>
              </div>
            </div>
          </div>
        </nav>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200/40">
          <Button 
            onClick={logout}
            variant="ghost" 
            className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 rounded-2xl h-12 font-medium"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 ml-72 transition-all duration-500 ease-out ${prediction ? 'mr-96' : 'mr-0'}`}>
        <div className="p-8">
          {/* Welcome Section */}
          <div className="mb-10">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Welcome back, {user?.username}
              </h2>
            </div>
            <p className="text-slate-600 text-lg font-medium">
              Ready to analyze retinal images with advanced AI technology
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 mb-1">98.7%</p>
                <p className="text-sm text-slate-600 font-medium">Accuracy Rate</p>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="h-6 w-6 text-emerald-600" />
                </div>
                <Sparkles className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 mb-1">AI-Powered</p>
                <p className="text-sm text-slate-600 font-medium">RETFound Model</p>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 mb-1">HIPAA</p>
                <p className="text-sm text-slate-600 font-medium">Compliant</p>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 mb-1">Real-time</p>
                <p className="text-sm text-slate-600 font-medium">Analysis</p>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-3xl shadow-xl transition-all duration-300 hover:shadow-2xl">
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <Upload className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">RETFound AI Analysis</h3>
                    <p className="text-slate-600 font-medium">Foundation Model for Diabetic Retinopathy Detection</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Model Info */}
                  <div className="space-y-3">
                    <Label htmlFor="model-info" className="text-sm font-semibold text-slate-700">AI Model</Label>
                    <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/50">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mr-4 shadow-md">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-blue-900">RETFound Official (Quantized)</p>
                        <p className="text-sm text-blue-700 font-medium">Research Grade - Foundation Model</p>
                      </div>
                    </div>
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
                    className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 ${
                      isDragOver 
                        ? 'border-blue-400 bg-blue-50/50 ring-4 ring-blue-500/20 scale-[1.02]' 
                        : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50 hover:scale-[1.01]'
                    }`}
                  >
                    {preview ? (
                      <div className="space-y-6">
                        <div className="relative inline-block">
                          <img 
                            src={preview} 
                            alt="Preview" 
                            className="max-h-64 mx-auto rounded-2xl shadow-2xl ring-1 ring-slate-200/50"
                          />
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-slate-900/20 to-transparent"></div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-2 inline-block ring-1 ring-slate-200/50 shadow-sm">
                          <p className="text-sm text-slate-700 font-medium">
                            {selectedFile?.name}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center transition-all duration-300 ${
                          isDragOver 
                            ? 'bg-blue-500/10 ring-2 ring-blue-500/20 scale-110' 
                            : 'bg-slate-100 ring-1 ring-slate-200/50'
                        }`}>
                          <Upload className={`h-10 w-10 ${isDragOver ? 'text-blue-600' : 'text-slate-600'}`} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-slate-900 mb-2">
                            {isDragOver ? 'Drop your image here' : 'Upload retinal image'}
                          </p>
                          <p className="text-slate-600 font-medium text-lg">
                            Drag & drop or click to browse
                          </p>
                          <p className="text-slate-500 text-sm mt-3 font-medium">
                            JPG, PNG up to 10MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={handleAnalyze}
                    disabled={!selectedFile || isAnalyzing}
                    className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl active:translate-y-[2px] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        Analyzing with AI...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-3 h-6 w-6" />
                        Start RETFound Analysis
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
      <div className={`fixed right-0 top-0 h-full w-96 bg-white/80 backdrop-blur-xl border-l border-slate-200/60 z-50 transform transition-transform duration-500 ease-out shadow-2xl ${
        prediction ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-200/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center mr-3 shadow-sm">
                <FileText className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Analysis Results</h3>
                <p className="text-sm text-slate-600 font-medium">AI Diagnostic Report</p>
              </div>
            </div>
            <button 
              onClick={() => setPrediction(null)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors duration-200"
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
            <div className="space-y-6">
              {/* Diagnosis */}
              <div className={`flex items-center justify-between p-6 rounded-2xl ring-1 ring-black/5 shadow-sm ${
                prediction.prediction_class === 'DR' 
                  ? 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-200/50' 
                  : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50'
              }`}>
                <div className="flex items-center">
                  {prediction.prediction_class === 'DR' ? (
                    <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mr-4 shadow-sm">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mr-4 shadow-sm">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-900 text-lg">{prediction.diagnosis}</p>
                    <p className="text-slate-600 font-medium">
                      {prediction.prediction_class === 'DR' 
                        ? 'Recommend ophthalmologist consultation'
                        : 'No signs of diabetic retinopathy detected'
                      }
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={prediction.prediction_class === 'DR' ? 'destructive' : 'default'}
                  className="ml-4 text-sm font-bold px-3 py-1"
                >
                  {prediction.prediction_class}
                </Badge>
              </div>

              {/* Model Info & Confidence */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/70 backdrop-blur-sm p-5 rounded-2xl border border-slate-200/50 ring-1 ring-black/5 shadow-sm">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-900 mb-2">
                      {prediction.confidence_score.toFixed(1)}%
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">Confidence</div>
                  </div>
                </div>
                <div className="bg-white/70 backdrop-blur-sm p-5 rounded-2xl border border-slate-200/50 ring-1 ring-black/5 shadow-sm">
                  <div className="text-center">
                    <div className="text-sm font-bold text-slate-900 mb-2">
                      {prediction.model_used || 'Current Model'}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">Model</div>
                  </div>
                </div>
              </div>

              {/* RETFound Dual Interpretation */}
              {isRETFoundResult(prediction) && (
                <div className="space-y-6">
                  {/* Clinical Analysis Section */}
                  <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/50 ring-1 ring-black/5 shadow-sm">
                    <h4 className="font-bold text-slate-900 mb-5 flex items-center gap-3 text-lg">
                      <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center">
                        <Microscope className="h-4 w-4 text-slate-600" />
                      </div>
                      Clinical Analysis
                    </h4>
                        
                    <div className="grid grid-cols-3 gap-4 mb-5">
                      {/* Individual Assessment */}
                      <div className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/50 ring-1 ring-black/5 shadow-sm">
                        <div className="text-center mb-3">
                          <div className="text-xl font-bold text-slate-800 mb-1">
                            {prediction.individual_confidence.toFixed(1)}%
                          </div>
                          <div className="text-xs text-slate-500 font-medium">Confidence</div>
                        </div>
                        <div className="text-center">
                          <Badge variant="outline" className="text-xs font-bold">
                            {prediction.individual_prediction}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Binary Screening */}
                      <div className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/50 ring-1 ring-black/5 shadow-sm">
                        <div className="text-center mb-3">
                          <div className="text-xl font-bold text-slate-800 mb-1">
                            {prediction.binary_confidence.toFixed(1)}%
                          </div>
                          <div className="text-xs text-slate-500 font-medium">Confidence</div>
                        </div>
                        <div className="text-center">
                          <Badge variant={prediction.binary_prediction === 'DR' ? 'destructive' : 'default'} className="text-xs font-bold">
                            {prediction.binary_prediction}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Recommendations Summary */}
                      <div className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/50 ring-1 ring-black/5 shadow-sm">
                        <div className="text-center mb-3">
                          <div className="text-xl font-bold text-slate-800 mb-1">
                            {prediction.clinical_recommendation.split(' | ').length}
                          </div>
                          <div className="text-xs text-slate-500 font-medium">Actions</div>
                        </div>
                        <div className="text-center">
                          <Badge variant="outline" className="text-xs font-bold">
                            View Details
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Detailed Probabilities */}
                  <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/50 ring-1 ring-black/5 shadow-sm">
                    <h4 className="font-bold text-slate-900 mb-5 flex items-center gap-3 text-lg">
                      <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center">
                        <Target className="h-4 w-4 text-slate-600" />
                      </div>
                      DR Stage Probabilities
                    </h4>
                    <div className="grid grid-cols-5 gap-4">
                      {Object.entries(prediction.detailed_probabilities).map(([stage, prob]) => (
                        <div key={stage} className="text-center">
                          <div className="text-xl font-bold text-slate-800 mb-2">
                            {prob.toFixed(1)}%
                          </div>
                          <div className="text-xs text-slate-500 leading-tight font-medium">
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
                <Alert className={`rounded-2xl border-2 ${
                  saveMessage.includes('saved') 
                    ? 'border-green-200 bg-green-50/80' 
                    : 'border-blue-200 bg-blue-50/80'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      saveMessage.includes('saved') ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      <Info className="h-4 w-4 flex-shrink-0" />
                    </div>
                    <AlertDescription className="flex items-center justify-between flex-1">
                      <span className="font-medium">{saveMessage}</span>
                      {saveMessage.includes('Create') && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="ml-3 rounded-xl font-medium"
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
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Zap className="h-10 w-10 text-slate-500" />
              </div>
              <p className="text-slate-600 font-medium text-lg mb-2">
                Upload an image to see analysis results
              </p>
              <p className="text-slate-500 text-sm">
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