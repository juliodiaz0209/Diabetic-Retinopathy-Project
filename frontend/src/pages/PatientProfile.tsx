import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { patientAPI, predictionAPI } from '@/lib/api';
import { 
  User, 
  UserPlus, 
  Calendar,
  Download,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Eye,
  TrendingUp,
  Activity,
  FileText,
  Clock,
  BarChart3
} from 'lucide-react';

interface Patient {
  name: string;
  age: number;
  gender: string;
  contact: string;
}

interface Prediction {
  patient_name: string;
  patient_id: number;
  prediction_class: string;
  confidence_score: number;
  prediction_date: string;
}

const PatientProfile = () => {
  const { } = useAuth();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    contact_info: '',
  });

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    setLoading(true);
    try {
      // Load patient info
      const patientResponse = await patientAPI.getMyPatient();
      setPatient(patientResponse.data);
      
      // Load predictions if patient exists
      if (patientResponse.data) {
        const predictionsResponse = await predictionAPI.getAll();
        setPredictions(predictionsResponse.data);
      }
    } catch (error) {
      console.error('Failed to load patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await patientAPI.create({
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        contact_info: formData.contact_info,
      });
      
      await loadPatientData();
      setShowAddForm(false);
      setFormData({ name: '', age: '', gender: 'Male', contact_info: '' });
    } catch (error) {
      console.error('Failed to save patient:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      const response = await predictionAPI.downloadReport();
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `predictions_report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
          <p className="text-slate-600 font-medium text-lg">Loading patient data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            onClick={() => navigate('/dashboard')}
            variant="ghost" 
            className="mb-6 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-2xl font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-3xl flex items-center justify-center shadow-2xl">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Patient Profile</h1>
              <p className="text-slate-600 text-lg font-medium">Manage patient information and view prediction history</p>
            </div>
          </div>
        </div>

        {/* Patient Info */}
        {patient ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Patient Details Card */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center text-2xl font-bold text-slate-900">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl flex items-center justify-center mr-4">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Name</label>
                      <p className="text-2xl font-bold text-slate-900">{patient.name}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Age</label>
                      <p className="text-2xl font-bold text-slate-900">{patient.age} years</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Gender</label>
                      <p className="text-2xl font-bold text-slate-900">{patient.gender}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Contact</label>
                      <p className="text-2xl font-bold text-slate-900">{patient.contact}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="space-y-6">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Activity className="h-6 w-6" />
                    </div>
                    <div className="text-3xl font-bold mb-2">{predictions.length}</div>
                    <div className="text-blue-100 font-medium">Total Predictions</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div className="text-3xl font-bold mb-2">
                      {predictions.length > 0 ? Math.round(predictions.reduce((acc, p) => acc + p.confidence_score, 0) / predictions.length) : 0}%
                    </div>
                    <div className="text-emerald-100 font-medium">Avg Confidence</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl mb-8">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center text-2xl font-bold text-slate-900">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl flex items-center justify-center mr-4">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                </div>
                No Patient Profile
              </CardTitle>
              <CardDescription className="text-slate-600 font-medium text-lg">
                Create a patient profile to save and track predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showAddForm ? (
                <Button 
                  onClick={() => setShowAddForm(true)}
                  className="h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl active:translate-y-[2px] transition-all duration-200"
                >
                  <UserPlus className="h-5 w-5 mr-3" />
                  Add Patient Profile
                </Button>
              ) : (
                <form onSubmit={handleSavePatient} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="name" className="text-sm font-semibold text-slate-700">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Patient name"
                        required
                        className="h-12 rounded-2xl border-slate-200/50 bg-white/50 backdrop-blur-sm text-slate-900 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="age" className="text-sm font-semibold text-slate-700">Age *</Label>
                      <Input
                        id="age"
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        placeholder="Age"
                        required
                        className="h-12 rounded-2xl border-slate-200/50 bg-white/50 backdrop-blur-sm text-slate-900 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="gender" className="text-sm font-semibold text-slate-700">Gender</Label>
                      <Select 
                        value={formData.gender} 
                        onValueChange={(value) => setFormData({ ...formData, gender: value })}
                      >
                        <SelectTrigger className="h-12 rounded-2xl border-slate-200/50 bg-white/50 backdrop-blur-sm text-slate-900 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="contact" className="text-sm font-semibold text-slate-700">Contact Info</Label>
                      <Input
                        id="contact"
                        value={formData.contact_info}
                        onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                        placeholder="Phone or email"
                        className="h-12 rounded-2xl border-slate-200/50 bg-white/50 backdrop-blur-sm text-slate-900 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <Button 
                      type="submit" 
                      disabled={saving}
                      className="h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl active:translate-y-[2px] transition-all duration-200"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-3 h-5 w-5" />
                          Save Patient
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowAddForm(false)}
                      className="h-12 rounded-2xl font-bold text-lg border-slate-200/50 hover:bg-slate-50 transition-all duration-200"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        {/* Predictions History */}
        {patient && (
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
            <CardHeader className="pb-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl flex items-center justify-center mr-4">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-900">Prediction History</CardTitle>
                    <CardDescription className="text-slate-600 font-medium text-lg">
                      {predictions.length} prediction(s) recorded
                    </CardDescription>
                  </div>
                </div>
                {predictions.length > 0 && (
                  <Button 
                    onClick={handleDownloadReport} 
                    variant="outline"
                    className="h-12 rounded-2xl font-bold text-lg border-slate-200/50 hover:bg-slate-50 transition-all duration-200"
                  >
                    <Download className="h-5 w-5 mr-3" />
                    Download Report
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {predictions.length > 0 ? (
                <div className="space-y-4">
                  {predictions.map((prediction, index) => (
                    <div
                      key={index}
                      className="bg-white/60 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 flex justify-between items-center hover:shadow-lg transition-all duration-300 group"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          prediction.prediction_class === 'DR' 
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          <Eye className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge 
                              variant={prediction.prediction_class === 'DR' ? 'destructive' : 'default'}
                              className="font-bold text-sm px-3 py-1"
                            >
                              {prediction.prediction_class === 'DR' ? 'DR Detected' : 'No DR'}
                            </Badge>
                            <div className="flex items-center text-slate-500 text-sm">
                              <Clock className="h-4 w-4 mr-1" />
                              {new Date(prediction.prediction_date).toLocaleDateString()}
                            </div>
                          </div>
                          <p className="text-slate-600 font-medium">
                            Confidence: <span className="font-bold text-slate-900">{prediction.confidence_score.toFixed(1)}%</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-slate-900">
                            {prediction.confidence_score.toFixed(1)}%
                          </div>
                          <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Confidence</div>
                        </div>
                        <BarChart3 className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <FileText className="h-10 w-10 text-slate-500" />
                  </div>
                  <p className="text-slate-600 font-medium text-lg mb-2">
                    No predictions recorded yet
                  </p>
                  <p className="text-slate-500 text-sm">
                    Start analyzing images to build prediction history
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PatientProfile;