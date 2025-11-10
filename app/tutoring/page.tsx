'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, GraduationCap, Star, Video, ArrowRight, Sparkles, Globe } from 'lucide-react';
import Link from 'next/link';

interface Tutor {
  id: string;
  name: string;
  subjects: string[];
  languages: string[];
  rating: number;
  studentsCount: number;
  pricePerHour: number;
  bio: string;
  available: boolean;
  avatar?: string;
}

const MOCK_TUTORS: Tutor[] = [
  {
    id: '1',
    name: 'Dr. Sarah Chen',
    subjects: ['Mathematics', 'Physics', 'Quantum Computing'],
    languages: ['English', 'Mandarin'],
    rating: 4.9,
    studentsCount: 127,
    pricePerHour: 25,
    bio: 'PhD in Quantum Physics with 10+ years teaching experience. Specializes in helping Chinese students understand complex physics concepts.',
    available: true,
  },
  {
    id: '2',
    name: 'Prof. Ahmad Wijaya',
    subjects: ['Chemistry', 'Biology'],
    languages: ['English', 'Bahasa Indonesia'],
    rating: 4.8,
    studentsCount: 89,
    pricePerHour: 20,
    bio: 'Chemistry professor with expertise in organic chemistry. Fluent in English and Bahasa Indonesia.',
    available: true,
  },
  {
    id: '3',
    name: 'Dr. Li Wei',
    subjects: ['Mathematics', 'Statistics'],
    languages: ['English', 'Mandarin'],
    rating: 5.0,
    studentsCount: 203,
    pricePerHour: 30,
    bio: 'Mathematics tutor specializing in calculus and statistics. Helps Chinese students excel in UK university courses.',
    available: false,
  },
];

export default function TutoringPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [userRole, setUserRole] = useState<'tutor' | 'student' | null>(null);

  const subjects = Array.from(new Set(MOCK_TUTORS.flatMap(t => t.subjects)));
  const languages = Array.from(new Set(MOCK_TUTORS.flatMap(t => t.languages)));

  const filteredTutors = MOCK_TUTORS.filter(tutor => {
    const matchesSearch = tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tutor.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tutor.subjects.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSubject = selectedSubject === 'all' || tutor.subjects.includes(selectedSubject);
    const matchesLanguage = selectedLanguage === 'all' || tutor.languages.includes(selectedLanguage);
    return matchesSearch && matchesSubject && matchesLanguage;
  });

  useEffect(() => {
    const savedRole = localStorage.getItem('ezstudy_user_role');
    if (savedRole === 'tutor' || savedRole === 'student') {
      setUserRole(savedRole as 'tutor' | 'student');
    }
  }, []);

  if (!userRole) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto px-6 py-20 max-w-5xl">
          {/* Professional Header */}
          <header className="mb-16 text-center animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-xl">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                ezstudy
              </h1>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Connect with Expert Tutors
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Personalized learning sessions with real-time translation and AI-powered assistance
            </p>
          </header>

          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div
              onClick={() => {
                setUserRole('student');
                localStorage.setItem('ezstudy_user_role', 'student');
              }}
              className="card card-hover cursor-pointer group border-2 border-transparent hover:border-primary-300"
            >
              <div className="flex flex-col items-center text-center p-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-all transform group-hover:scale-110">
                  <GraduationCap className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">I&apos;m a Student</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Find expert tutors to help you learn and understand complex subjects with real-time translation support
                </p>
                <div className="flex items-center text-primary-600 font-semibold group-hover:text-primary-700 transition-colors">
                  Browse Tutors <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            <div
              onClick={() => {
                setUserRole('tutor');
                localStorage.setItem('ezstudy_user_role', 'tutor');
              }}
              className="card card-hover cursor-pointer group border-2 border-transparent hover:border-purple-300"
            >
              <div className="flex flex-col items-center text-center p-8">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-all transform group-hover:scale-110">
                  <User className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">I&apos;m a Tutor</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Share your expertise and help students achieve their academic goals with integrated learning tools
                </p>
                <div className="flex items-center text-purple-600 font-semibold group-hover:text-purple-700 transition-colors">
                  Start Teaching <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (userRole === 'tutor') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto px-6 py-12 max-w-6xl">
          <header className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Tutor Dashboard</h1>
                <p className="text-gray-600">Manage your tutoring sessions and help students succeed</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setUserRole(null);
                    localStorage.removeItem('ezstudy_user_role');
                  }}
                  className="px-5 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all border border-gray-200 font-semibold shadow-sm"
                >
                  Switch Role
                </button>
                <Link
                  href="/"
                  className="px-5 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all border border-gray-200 font-semibold shadow-sm"
                >
                  Back to Home
                </Link>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                  <User className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Tutor Features Coming Soon</h2>
                  <p className="text-gray-600">We&apos;re building powerful tools for tutors</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {[
                  'Create your tutor profile',
                  'Set your availability and pricing',
                  'Accept session requests from students',
                  'Conduct video sessions with integrated translation tools',
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span className="text-gray-700 font-medium">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="p-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                <p className="text-blue-900 text-sm font-medium">
                  💡 For now, you can test the tutoring experience by selecting &quot;I&apos;m a Student&quot; and browsing available tutors.
                </p>
              </div>
            </div>
          </header>
        </div>
      </main>
    );
  }

  // Student view - Browse tutors
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Professional Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        <div className="container mx-auto px-6 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Find Your Tutor</h1>
                <p className="text-xs text-gray-500 font-medium">Expert tutors with real-time translation</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setUserRole(null);
                  localStorage.removeItem('ezstudy_user_role');
                }}
                className="px-4 py-2 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all border border-gray-200 font-semibold text-sm shadow-sm"
              >
                Switch Role
              </button>
              <Link
                href="/"
                className="px-4 py-2 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all border border-gray-200 font-semibold text-sm shadow-sm"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Search and Filters */}
        <div className="card mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tutors by name, subject, or expertise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-12"
              />
            </div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="input md:w-48"
            >
              <option value="all">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="input md:w-48"
            >
              <option value="all">All Languages</option>
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tutors Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutors.map(tutor => (
            <div
              key={tutor.id}
              className="card card-hover group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {tutor.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{tutor.name}</h3>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-bold text-gray-700">{tutor.rating}</span>
                      <span className="text-xs text-gray-500">({tutor.studentsCount} students)</span>
                    </div>
                  </div>
                </div>
                {tutor.available && (
                  <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                    Available
                  </span>
                )}
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">{tutor.bio}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {tutor.subjects.slice(0, 2).map(subject => (
                  <span
                    key={subject}
                    className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-semibold rounded-lg"
                  >
                    {subject}
                  </span>
                ))}
                {tutor.subjects.length > 2 && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg">
                    +{tutor.subjects.length - 2} more
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div>
                  <span className="text-3xl font-bold text-gray-900">${tutor.pricePerHour}</span>
                  <span className="text-gray-600 text-sm ml-1">/hour</span>
                </div>
                <Link
                  href={`/tutoring/session/${tutor.id}`}
                  className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Video className="h-4 w-4" />
                  Book Session
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredTutors.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg font-medium mb-2">No tutors found</p>
            <p className="text-gray-500 text-sm mb-6">Try adjusting your search or filters</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubject('all');
                setSelectedLanguage('all');
              }}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-semibold shadow-lg"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
