import React, { useState, useEffect } from 'react';
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
  Loader2
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Patient Profile</h1>
          <p className="text-gray-600">Manage patient information and view prediction history</p>
        </div>

        {/* Patient Info */}
        {patient ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <p className="text-lg font-semibold">{patient.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Age</label>
                  <p className="text-lg font-semibold">{patient.age} years</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Gender</label>
                  <p className="text-lg font-semibold">{patient.gender}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Contact</label>
                  <p className="text-lg font-semibold">{patient.contact}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
                No Patient Profile
              </CardTitle>
              <CardDescription>
                Create a patient profile to save and track predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showAddForm ? (
                <Button onClick={() => setShowAddForm(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Patient Profile
                </Button>
              ) : (
                <form onSubmit={handleSavePatient} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Patient name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age">Age *</Label>
                      <Input
                        id="age"
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        placeholder="Age"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select 
                        value={formData.gender} 
                        onValueChange={(value) => setFormData({ ...formData, gender: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact">Contact Info</Label>
                      <Input
                        id="contact"
                        value={formData.contact_info}
                        onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                        placeholder="Phone or email"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Save Patient
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowAddForm(false)}
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
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Prediction History
                  </CardTitle>
                  <CardDescription>
                    {predictions.length} prediction(s) recorded
                  </CardDescription>
                </div>
                {predictions.length > 0 && (
                  <Button onClick={handleDownloadReport} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {predictions.length > 0 ? (
                <div className="space-y-3">
                  {predictions.map((prediction, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 flex justify-between items-center hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-3">
                        <Badge 
                          variant={prediction.prediction_class === 'DR' ? 'destructive' : 'default'}
                          className="font-medium"
                        >
                          {prediction.prediction_class === 'DR' ? 'DR Detected' : 'No DR'}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">
                            Confidence: {prediction.confidence_score.toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(prediction.prediction_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No predictions recorded yet. Start analyzing images to build history.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PatientProfile;