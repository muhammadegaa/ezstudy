'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, GraduationCap, Clock, Star, Video, ArrowRight } from 'lucide-react';
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

// Mock tutors data - in production, this would come from a database
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

  // Check if user has selected a role
  useEffect(() => {
    const savedRole = localStorage.getItem('ezstudy_user_role');
    if (savedRole === 'tutor' || savedRole === 'student') {
      setUserRole(savedRole as 'tutor' | 'student');
    }
  }, []);

  if (!userRole) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              ezstudy Tutoring Platform
            </h1>
            <p className="text-xl text-gray-600">
              Connect with expert tutors for personalized learning sessions
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div
              onClick={() => {
                setUserRole('student');
                localStorage.setItem('ezstudy_user_role', 'student');
              }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-blue-500"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 mx-auto">
                <GraduationCap className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">I&apos;m a Student</h2>
              <p className="text-gray-600 text-center mb-6">
                Find expert tutors to help you learn and understand complex subjects
              </p>
              <div className="flex items-center justify-center text-blue-600 font-medium">
                Browse Tutors <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </div>

            <div
              onClick={() => {
                setUserRole('tutor');
                localStorage.setItem('ezstudy_user_role', 'tutor');
              }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-purple-500"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4 mx-auto">
                <User className="h-8 w-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">I&apos;m a Tutor</h2>
              <p className="text-gray-600 text-center mb-6">
                Share your expertise and help students achieve their academic goals
              </p>
              <div className="flex items-center justify-center text-purple-600 font-medium">
                Start Teaching <ArrowRight className="h-4 w-4 ml-2" />
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
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Tutor Dashboard</h1>
              <p className="text-gray-600">Manage your tutoring sessions</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setUserRole(null);
                  localStorage.removeItem('ezstudy_user_role');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Switch Role
              </button>
              <Link
                href="/"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Tutor Features Coming Soon</h2>
            <p className="text-gray-600 mb-6">
              As a tutor, you&apos;ll be able to:
            </p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                Create your tutor profile
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                Set your availability and pricing
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                Accept session requests from students
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                Conduct video sessions with integrated translation tools
              </li>
            </ul>
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-sm">
                💡 For now, you can test the tutoring experience by selecting &quot;I&apos;m a Student&quot; and browsing available tutors.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Student view - Browse tutors
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Find Your Tutor</h1>
            <p className="text-gray-600">Browse expert tutors and book sessions</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setUserRole(null);
                localStorage.removeItem('ezstudy_user_role');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Switch Role
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tutors by name, subject, or expertise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Languages</option>
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tutors List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutors.map(tutor => (
            <div
              key={tutor.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {tutor.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{tutor.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-medium text-gray-700">{tutor.rating}</span>
                        <span className="text-sm text-gray-500">({tutor.studentsCount} students)</span>
                      </div>
                    </div>
                  </div>
                  {tutor.available && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                      Available
                    </span>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{tutor.bio}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {tutor.subjects.slice(0, 2).map(subject => (
                    <span
                      key={subject}
                      className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded"
                    >
                      {subject}
                    </span>
                  ))}
                  {tutor.subjects.length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                      +{tutor.subjects.length - 2} more
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">${tutor.pricePerHour}</span>
                    <span className="text-gray-600 text-sm">/hour</span>
                  </div>
                  <Link
                    href={`/tutoring/session/${tutor.id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Video className="h-4 w-4" />
                    Book Session
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTutors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No tutors found matching your criteria.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubject('all');
                setSelectedLanguage('all');
              }}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
