import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AlertCircle, Loader2, CheckCircle, Sparkles, Shield, Zap, UserPlus } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl"></div>
        </div>

        <Card className="w-full max-w-md border-0 shadow-2xl bg-white/80 backdrop-blur-xl relative z-10">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">
                Account Created Successfully!
              </h2>
              <p className="text-slate-600 font-medium text-lg mb-6">
                Redirecting you to the login page...
              </p>
              <div className="w-16 h-16 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-slate-200/30 to-slate-300/30 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl mb-4">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-3">Join RetinaScan AI</h1>
          <p className="text-slate-600 text-lg font-medium">Professional Healthcare Innovation Platform</p>
        </div>

        {/* Registration Form */}
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-slate-900">Create Account</CardTitle>
            <CardDescription className="text-slate-600 font-medium">
              Set up your professional healthcare account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <div className="flex items-center space-x-3 text-red-600 bg-red-50/80 p-4 rounded-2xl border border-red-200/50">
                  <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}
              
              <div className="space-y-3">
                <label htmlFor="name" className="text-sm font-semibold text-slate-700">
                  Full Name
                </label>
                <div className="relative">
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Dr. John Smith"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="h-12 rounded-2xl border-slate-200/50 bg-white/50 backdrop-blur-sm text-slate-900 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <label htmlFor="username" className="text-sm font-semibold text-slate-700">
                  Username
                </label>
                <div className="relative">
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Choose a unique username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="h-12 rounded-2xl border-slate-200/50 bg-white/50 backdrop-blur-sm text-slate-900 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                  Email
                </label>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your.email@hospital.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="h-12 rounded-2xl border-slate-200/50 bg-white/50 backdrop-blur-sm text-slate-900 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a secure password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="h-12 rounded-2xl border-slate-200/50 bg-white/50 backdrop-blur-sm text-slate-900 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-6 pt-6">
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl active:translate-y-[2px] transition-all duration-200" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-3 h-5 w-5" />
                    Create Account
                  </>
                )}
              </Button>
              
              <p className="text-sm text-center text-slate-600 font-medium">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className="text-blue-600 hover:text-blue-700 font-bold transition-colors duration-200"
                >
                  Sign In
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        {/* Features */}
        <div className="mt-10 grid grid-cols-3 gap-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-slate-200/50 text-center group hover:scale-105 transition-all duration-300">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-blue-600 font-bold text-sm mb-1">AI-Powered</div>
            <div className="text-xs text-slate-600 font-medium">Analysis</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-slate-200/50 text-center group hover:scale-105 transition-all duration-300">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Shield className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="text-emerald-600 font-bold text-sm mb-1">HIPAA</div>
            <div className="text-xs text-slate-600 font-medium">Compliant</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-slate-200/50 text-center group hover:scale-105 transition-all duration-300">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-purple-600 font-bold text-sm mb-1">Clinical</div>
            <div className="text-xs text-slate-600 font-medium">Reports</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;