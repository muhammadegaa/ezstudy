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
    subjects: ['Chemistry', 'Biology', 'Organic Chemistry'],
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
    subjects: ['Mathematics', 'Statistics', 'Calculus'],
    languages: ['English', 'Mandarin'],
    rating: 5.0,
    studentsCount: 203,
    pricePerHour: 30,
    bio: 'Mathematics tutor specializing in calculus and statistics. Helps Chinese students excel in UK university courses.',
    available: true,
  },
  {
    id: '4',
    name: 'Dr. Emily Rodriguez',
    subjects: ['Computer Science', 'Data Structures', 'Algorithms'],
    languages: ['English', 'Spanish'],
    rating: 4.9,
    studentsCount: 156,
    pricePerHour: 35,
    bio: 'Software engineer and university lecturer. Expert in computer science fundamentals and competitive programming.',
    available: true,
  },
  {
    id: '5',
    name: 'Prof. Budi Santoso',
    subjects: ['Biology', 'Genetics', 'Molecular Biology'],
    languages: ['English', 'Bahasa Indonesia'],
    rating: 4.7,
    studentsCount: 94,
    pricePerHour: 22,
    bio: 'Dedicated biology tutor with PhD in Genetics. Helps Indonesian students master complex biological concepts.',
    available: true,
  },
  {
    id: '6',
    name: 'Dr. Zhang Ming',
    subjects: ['Physics', 'Thermodynamics', 'Electromagnetism'],
    languages: ['English', 'Mandarin'],
    rating: 4.8,
    studentsCount: 112,
    pricePerHour: 28,
    bio: 'Physics professor specializing in thermodynamics and electromagnetism. Makes complex physics accessible.',
    available: true,
  },
  {
    id: '7',
    name: 'Ms. Siti Nurhaliza',
    subjects: ['Chemistry', 'Biochemistry', 'Analytical Chemistry'],
    languages: ['English', 'Bahasa Indonesia'],
    rating: 4.9,
    studentsCount: 78,
    pricePerHour: 24,
    bio: 'Chemistry tutor with expertise in biochemistry and analytical chemistry. Patient and thorough teaching style.',
    available: true,
  },
  {
    id: '8',
    name: 'Dr. James Wilson',
    subjects: ['Mathematics', 'Linear Algebra', 'Differential Equations'],
    languages: ['English'],
    rating: 4.9,
    studentsCount: 189,
    pricePerHour: 32,
    bio: 'Mathematics professor with 15+ years experience. Specializes in linear algebra and differential equations.',
    available: true,
  },
  {
    id: '9',
    name: 'Prof. Chen Xiaoli',
    subjects: ['Computer Science', 'Machine Learning', 'Python'],
    languages: ['English', 'Mandarin'],
    rating: 5.0,
    studentsCount: 245,
    pricePerHour: 40,
    bio: 'AI researcher and ML expert. Helps students understand machine learning concepts and Python programming.',
    available: true,
  },
  {
    id: '10',
    name: 'Dr. Rina Kartika',
    subjects: ['Biology', 'Cell Biology', 'Microbiology'],
    languages: ['English', 'Bahasa Indonesia'],
    rating: 4.8,
    studentsCount: 67,
    pricePerHour: 21,
    bio: 'Cell biology expert with PhD in Microbiology. Makes complex biological processes easy to understand.',
    available: true,
  },
  {
    id: '11',
    name: 'Dr. Michael Brown',
    subjects: ['Physics', 'Mechanics', 'Optics'],
    languages: ['English'],
    rating: 4.7,
    studentsCount: 134,
    pricePerHour: 29,
    bio: 'Physics tutor specializing in mechanics and optics. Clear explanations and practical examples.',
    available: true,
  },
  {
    id: '12',
    name: 'Prof. Wang Fang',
    subjects: ['Mathematics', 'Number Theory', 'Abstract Algebra'],
    languages: ['English', 'Mandarin'],
    rating: 4.9,
    studentsCount: 98,
    pricePerHour: 33,
    bio: 'Mathematics professor with expertise in number theory and abstract algebra. Helps students master advanced concepts.',
    available: true,
  },
  {
    id: '13',
    name: 'Dr. Andi Pratama',
    subjects: ['Chemistry', 'Physical Chemistry', 'Inorganic Chemistry'],
    languages: ['English', 'Bahasa Indonesia'],
    rating: 4.8,
    studentsCount: 76,
    pricePerHour: 23,
    bio: 'Chemistry tutor covering physical and inorganic chemistry. Patient teaching approach for complex topics.',
    available: true,
  },
  {
    id: '14',
    name: 'Dr. Lisa Thompson',
    subjects: ['Biology', 'Ecology', 'Evolutionary Biology'],
    languages: ['English'],
    rating: 4.9,
    studentsCount: 145,
    pricePerHour: 27,
    bio: 'Biology professor specializing in ecology and evolutionary biology. Engaging teaching style with real-world examples.',
    available: true,
  },
  {
    id: '15',
    name: 'Prof. Liu Hong',
    subjects: ['Computer Science', 'Database Systems', 'Software Engineering'],
    languages: ['English', 'Mandarin'],
    rating: 4.9,
    studentsCount: 167,
    pricePerHour: 36,
    bio: 'Software engineering expert with industry experience. Teaches database systems and software development best practices.',
    available: true,
  },
  {
    id: '16',
    name: 'Dr. Dewi Sari',
    subjects: ['Mathematics', 'Geometry', 'Trigonometry'],
    languages: ['English', 'Bahasa Indonesia'],
    rating: 4.7,
    studentsCount: 89,
    pricePerHour: 20,
    bio: 'Mathematics tutor specializing in geometry and trigonometry. Helps students build strong foundational skills.',
    available: true,
  },
  {
    id: '17',
    name: 'Dr. Robert Kim',
    subjects: ['Physics', 'Quantum Mechanics', 'Atomic Physics'],
    languages: ['English'],
    rating: 5.0,
    studentsCount: 201,
    pricePerHour: 38,
    bio: 'Quantum physics expert with research background. Makes quantum mechanics accessible to students.',
    available: true,
  },
  {
    id: '18',
    name: 'Prof. Huang Mei',
    subjects: ['Computer Science', 'Web Development', 'JavaScript'],
    languages: ['English', 'Mandarin'],
    rating: 4.8,
    studentsCount: 178,
    pricePerHour: 34,
    bio: 'Full-stack developer and instructor. Teaches modern web development with JavaScript and React.',
    available: true,
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
              <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
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
                <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-all transform group-hover:scale-110">
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
              className="card card-hover cursor-pointer group border-2 border-transparent hover:border-primary-300"
            >
              <div className="flex flex-col items-center text-center p-8">
                <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-all transform group-hover:scale-110">
                  <User className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">I&apos;m a Tutor</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Share your expertise and help students achieve their academic goals with integrated learning tools
                </p>
                <div className="flex items-center text-primary-600 font-semibold group-hover:text-primary-700 transition-colors">
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
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <User className="h-6 w-6 text-primary-600" />
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
                    <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                    <span className="text-gray-700 font-medium">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="p-5 bg-primary-50 rounded-xl border border-primary-200">
                <p className="text-primary-900 text-sm font-medium">
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
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
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
                  <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
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
                  className="px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
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
