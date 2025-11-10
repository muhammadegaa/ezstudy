'use client';

import Link from 'next/link';
import { Star, Video } from 'lucide-react';
import type { Tutor } from '@/lib/firebase/firestore';

interface TutorCardProps {
  tutor: Tutor;
}

export default function TutorCard({ tutor }: TutorCardProps) {
  return (
    <div className="card card-hover group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
            {tutor.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{tutor.name}</h3>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-bold text-gray-700">{tutor.rating.toFixed(1)}</span>
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
          className="px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all flex items-center gap-2 font-semibold shadow-md hover:shadow-lg transform hover:scale-105"
        >
          <Video className="h-4 w-4" />
          Book Session
        </Link>
      </div>
    </div>
  );
}

