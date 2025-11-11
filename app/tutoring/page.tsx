'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, GraduationCap, Star, Video, ArrowRight, Sparkles, Globe, Calendar, Clock, Users as UsersIcon, Settings, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getTutors, getTutorByUserId, createOrUpdateTutor, type Tutor as FirestoreTutor } from '@/lib/firebase/firestore';
import { getUserSessions, createSession, updateSession, type Session as FirestoreSession } from '@/lib/firebase/firestore';
import { getUserProfile, createOrUpdateUserProfile } from '@/lib/firebase/userProfile';
import { useToast } from '@/components/ui/Toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { SkeletonTutorCard } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

// UI-friendly tutor type (without Firestore Timestamps)
interface UITutor {
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

// UI-friendly session type
interface UISession {
  id: string;
  studentName: string;
  studentEmail: string;
  tutorId: string;
  tutorName: string;
  tutorEmail: string;
  subject: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  scheduledTime?: Date;
  peerId?: string;
}

export default function TutoringPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [userRole, setUserRole] = useState<'tutor' | 'student' | null>(null);
  const [tutors, setTutors] = useState<UITutor[]>([]);
  const [tutorSessions, setTutorSessions] = useState<UISession[]>([]);
  const [studentSessions, setStudentSessions] = useState<UISession[]>([]);
  const [activeTab, setActiveTab] = useState<'sessions' | 'profile'>('sessions');
  const [studentActiveTab, setStudentActiveTab] = useState<'browse' | 'my-sessions'>('browse');
  const [loading, setLoading] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Get all unique subjects and languages from tutors
  const subjects = Array.from(new Set(tutors.flatMap(t => t.subjects)));
  const languages = Array.from(new Set(tutors.flatMap(t => t.languages)));

  // Filter tutors based on search and filters
  const filteredTutors = tutors.filter(tutor => {
    const matchesSearch = tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tutor.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tutor.subjects.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSubject = selectedSubject === 'all' || tutor.subjects.includes(selectedSubject);
    const matchesLanguage = selectedLanguage === 'all' || tutor.languages.includes(selectedLanguage);
    return matchesSearch && matchesSubject && matchesLanguage;
  });

  // Load user profile and determine role
  useEffect(() => {
    if (!authLoading && user) {
      const loadUserProfile = async () => {
        try {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setUserProfile(profile);
            setUserRole(profile.role);
          } else {
            // Create default profile if doesn't exist
            await createOrUpdateUserProfile(user.uid, {
              email: user.email || '',
              displayName: user.displayName || 'User',
              role: 'student',
            });
            setUserRole('student');
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
          addToast({ title: 'Error', description: 'Failed to load profile', type: 'error' });
        }
      };
      loadUserProfile();
    }
  }, [user, authLoading, addToast]);

  // Load tutors from Firestore
  useEffect(() => {
    const loadTutors = async () => {
      if (userRole === 'student') {
        setLoading(true);
        try {
          const firestoreTutors = await getTutors({ available: true });
          // Convert Firestore tutors to UI format
          const uiTutors: UITutor[] = firestoreTutors.map(tutor => ({
            id: tutor.id,
            name: tutor.name,
            subjects: tutor.subjects,
            languages: tutor.languages,
            rating: tutor.rating,
            studentsCount: tutor.studentsCount,
            pricePerHour: tutor.pricePerHour,
            bio: tutor.bio,
            available: tutor.available,
            avatar: tutor.avatar,
          }));
          setTutors(uiTutors);
        } catch (error) {
          console.error('Error loading tutors:', error);
          addToast({ title: 'Error', description: 'Failed to load tutors', type: 'error' });
        } finally {
          setLoading(false);
        }
      }
    };

    if (userRole === 'student') {
      loadTutors();
    }
  }, [userRole, addToast]);

  // Load tutor sessions from Firestore
  useEffect(() => {
    const loadSessions = async () => {
      if (userRole === 'tutor' && user) {
        setLoadingSessions(true);
        try {
          const firestoreSessions = await getUserSessions(user.uid, 'tutor');
          const uiSessions: UISession[] = firestoreSessions.map(session => ({
            id: session.id,
            studentName: session.studentName,
            studentEmail: session.studentEmail,
            tutorId: session.tutorId,
            tutorName: session.tutorName,
            tutorEmail: session.tutorEmail,
            subject: session.subject,
            status: session.status,
            scheduledTime: session.scheduledTime?.toDate(),
            peerId: session.peerId,
          }));
          setTutorSessions(uiSessions);
        } catch (error) {
          console.error('Error loading sessions:', error);
          addToast({ title: 'Error', description: 'Failed to load sessions', type: 'error' });
        } finally {
          setLoadingSessions(false);
        }
      } else if (userRole === 'student' && user) {
        setLoadingSessions(true);
        try {
          const firestoreSessions = await getUserSessions(user.uid, 'student');
          const uiSessions: UISession[] = firestoreSessions.map(session => ({
            id: session.id,
            studentName: session.studentName,
            studentEmail: session.studentEmail,
            tutorId: session.tutorId,
            tutorName: session.tutorName,
            tutorEmail: session.tutorEmail,
            subject: session.subject,
            status: session.status,
            scheduledTime: session.scheduledTime?.toDate(),
            peerId: session.peerId,
          }));
          setStudentSessions(uiSessions);
        } catch (error) {
          console.error('Error loading student sessions:', error);
          addToast({ title: 'Error', description: 'Failed to load sessions', type: 'error' });
        } finally {
          setLoadingSessions(false);
        }
      }
    };

    if ((userRole === 'tutor' || userRole === 'student') && user) {
      loadSessions();
    }
  }, [userRole, user, addToast]);

  const handleBookSession = async (tutorId: string) => {
    if (!user || !userProfile) {
      addToast({ title: 'Error', description: 'Please sign in to book a session', type: 'error' });
      return;
    }

    try {
      const tutor = tutors.find(t => t.id === tutorId);
      if (!tutor) {
        addToast({ title: 'Error', description: 'Tutor not found', type: 'error' });
        return;
      }

      // Create session in Firestore
      const sessionId = await createSession({
        studentId: user.uid,
        studentName: user.displayName || userProfile.displayName || 'Student',
        studentEmail: user.email || userProfile.email,
        tutorId: tutorId,
        tutorName: tutor.name,
        tutorEmail: '', // Will be fetched from tutor profile if needed
        subject: tutor.subjects[0] || 'General',
        status: 'pending',
      });

      addToast({ title: 'Success', description: 'Session booked successfully!', type: 'success' });
      router.push(`/tutoring/session/${tutorId}?sessionId=${sessionId}`);
    } catch (error: any) {
      console.error('Error booking session:', error);
      addToast({ title: 'Error', description: error.message || 'Failed to book session', type: 'error' });
    }
  };

  const createTutorSession = async () => {
    if (!user) {
      addToast({ title: 'Error', description: 'Please sign in', type: 'error' });
      return;
    }

    try {
      // Get or create tutor profile
      let tutorProfile = await getTutorByUserId(user.uid);
      if (!tutorProfile) {
        // Create tutor profile
        await createOrUpdateTutor(user.uid, {
          userId: user.uid,
          name: user.displayName || 'Tutor',
          email: user.email || '',
          subjects: ['General'],
          languages: ['English'],
          rating: 0,
          studentsCount: 0,
          pricePerHour: 20,
          bio: 'New tutor',
          available: true,
        });
        tutorProfile = await getTutorByUserId(user.uid);
      }

      if (!tutorProfile) {
        throw new Error('Failed to create tutor profile');
      }

      // Create session
      const sessionId = await createSession({
        studentId: '', // Will be filled when student joins
        studentName: 'Waiting for student...',
        studentEmail: '',
        tutorId: user.uid,
        tutorName: tutorProfile.name,
        tutorEmail: tutorProfile.email,
        subject: 'General',
        status: 'pending',
      });

      addToast({ title: 'Success', description: 'Session created!', type: 'success' });
      router.push(`/tutoring/session/tutor-${sessionId}`);
    } catch (error: any) {
      console.error('Error creating session:', error);
      addToast({ title: 'Error', description: error.message || 'Failed to create session', type: 'error' });
    }
  };

  const joinSessionAsTutor = (sessionId: string) => {
    router.push(`/tutoring/session/tutor-${sessionId}`);
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Role selection screen
  if (!userRole) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto px-6 py-20 max-w-5xl">
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

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div
              onClick={async () => {
                if (user && userProfile) {
                  await createOrUpdateUserProfile(user.uid, {
                    email: user.email || '',
                    displayName: user.displayName || 'User',
                    role: 'student',
                  });
                  setUserRole('student');
                } else {
                  setUserRole('student');
                }
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
              onClick={async () => {
                if (user && userProfile) {
                  await createOrUpdateUserProfile(user.uid, {
                    email: user.email || '',
                    displayName: user.displayName || 'User',
                    role: 'tutor',
                  });
                  setUserRole('tutor');
                } else {
                  setUserRole('tutor');
                }
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

  // Tutor Dashboard
  if (userRole === 'tutor') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
          <div className="container mx-auto px-6 py-4 max-w-7xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Tutor Dashboard</h1>
                  <p className="text-xs text-gray-500 font-medium">Manage your tutoring sessions</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setUserRole(null)}
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
          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-6 py-3 font-semibold transition-all border-b-2 ${
                activeTab === 'sessions'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Sessions
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-3 font-semibold transition-all border-b-2 ${
                activeTab === 'profile'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Profile
            </button>
          </div>

          {activeTab === 'sessions' && (
            <div className="space-y-6">
              {/* Create Session Button */}
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Start a Session</h2>
                    <p className="text-gray-600 text-sm">Create a new tutoring session and wait for students to join</p>
                  </div>
                  <button
                    onClick={createTutorSession}
                    className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Plus className="h-5 w-5" />
                    New Session
                  </button>
                </div>
              </div>

              {/* Active Sessions */}
              {loadingSessions ? (
                <div className="card text-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading sessions...</p>
                </div>
              ) : tutorSessions.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">Your Sessions</h3>
                  {tutorSessions.map((session) => (
                    <div
                      key={session.id}
                      className="card card-hover"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                            <Video className="h-6 w-6 text-primary-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">
                              {session.studentName === 'Waiting for student...' ? 'Waiting for student...' : `Session with ${session.studentName}`}
                            </h4>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {session.status === 'pending' ? 'Pending' : session.status === 'active' ? 'Active' : 'Completed'}
                              </span>
                              <span className="flex items-center gap-1">
                                <UsersIcon className="h-4 w-4" />
                                {session.subject}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          {session.status === 'pending' && (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                              Waiting
                            </span>
                          )}
                          {session.status === 'active' && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                              Active
                            </span>
                          )}
                          <button
                            onClick={() => joinSessionAsTutor(session.id)}
                            className="px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-semibold flex items-center gap-2 shadow-md hover:shadow-lg"
                          >
                            <Video className="h-4 w-4" />
                            {session.status === 'pending' ? 'Start' : 'Join'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card text-center py-12">
                  <Video className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Sessions Yet</h3>
                  <p className="text-gray-600 mb-6">Create your first tutoring session to get started</p>
                  <button
                    onClick={createTutorSession}
                    className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-semibold flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl"
                  >
                    <Plus className="h-5 w-5" />
                    Create Session
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="card">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {user?.displayName?.[0]?.toUpperCase() || 'T'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Your Tutor Profile</h2>
                  <p className="text-gray-600">Manage your profile and availability</p>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-gray-600">
                  Profile management coming soon. For now, you can create sessions and start teaching!
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  // Student View - Browse Tutors
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        <div className="container mx-auto px-6 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Find Tutors</h1>
                <p className="text-xs text-gray-500 font-medium">Browse and book tutoring sessions</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setUserRole(null)}
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
        {/* Student Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setStudentActiveTab('browse')}
            className={`px-6 py-3 font-semibold transition-all border-b-2 ${
              studentActiveTab === 'browse'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Browse Tutors
          </button>
          <button
            onClick={() => setStudentActiveTab('my-sessions')}
            className={`px-6 py-3 font-semibold transition-all border-b-2 ${
              studentActiveTab === 'my-sessions'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            My Sessions ({studentSessions.length})
          </button>
        </div>

        {studentActiveTab === 'my-sessions' ? (
          <div className="space-y-6">
            {loadingSessions ? (
              <div className="card text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading sessions...</p>
              </div>
            ) : studentSessions.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Your Sessions</h3>
                {studentSessions.map((session) => (
                  <div key={session.id} className="card card-hover">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                          <Video className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">Session with {session.tutorName}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {session.status === 'pending' ? 'Pending' : session.status === 'active' ? 'Active' : 'Completed'}
                            </span>
                            <span className="flex items-center gap-1">
                              <UsersIcon className="h-4 w-4" />
                              {session.subject}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        {session.status === 'pending' && (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                            Waiting
                          </span>
                        )}
                        {session.status === 'active' && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                            Active
                          </span>
                        )}
                        <button
                          onClick={() => router.push(`/tutoring/session/${session.tutorId}?sessionId=${session.id}`)}
                          className="px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-semibold flex items-center gap-2 shadow-md hover:shadow-lg"
                        >
                          <Video className="h-4 w-4" />
                          {session.status === 'pending' ? 'Join' : session.status === 'active' ? 'Rejoin' : 'View'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card text-center py-12">
                <Video className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Sessions Yet</h3>
                <p className="text-gray-600 mb-6">Book your first tutoring session to get started</p>
                <button
                  onClick={() => setStudentActiveTab('browse')}
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-semibold flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl"
                >
                  Browse Tutors
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Search and Filters */}
            <div className="card mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tutors, subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Languages</option>
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tutors Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonTutorCard key={i} />
            ))}
          </div>
        ) : filteredTutors.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutors.map((tutor) => (
              <div key={tutor.id} className="card card-hover">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                      {tutor.name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{tutor.name}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-semibold text-gray-700">{tutor.rating}</span>
                        <span className="text-xs text-gray-500">({tutor.studentsCount} students)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{tutor.bio}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {tutor.subjects.slice(0, 3).map(subject => (
                    <span key={subject} className="px-2 py-1 bg-primary-50 text-primary-700 text-xs font-semibold rounded-lg">
                      {subject}
                    </span>
                  ))}
                  {tutor.subjects.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg">
                      +{tutor.subjects.length - 3}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Globe className="h-4 w-4" />
                    <span>{tutor.languages.join(', ')}</span>
                  </div>
                  <div className="text-lg font-bold text-primary-600">
                    £{tutor.pricePerHour}/hr
                  </div>
                </div>

                <button
                  onClick={() => handleBookSession(tutor.id)}
                  className="w-full mt-4 px-4 py-3 h-11 min-h-[44px] bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Video className="h-5 w-5" />
                  Book Session
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Tutors Found</h3>
            <p className="text-gray-600">
              {searchQuery || selectedSubject !== 'all' || selectedLanguage !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'No tutors available at the moment. Check back later!'}
            </p>
          </div>
        )}
          </>
        )}
      </div>
    </main>
  );
}
