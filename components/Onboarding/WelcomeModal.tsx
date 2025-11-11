'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, SparklesIcon, VideoCameraIcon, LanguageIcon, BookOpenIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const steps = [
  {
    id: 1,
    title: 'Welcome to ezstudy!',
    description: 'Your AI-powered academic translation and learning companion',
    icon: SparklesIcon,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600">
          ezstudy helps Chinese and Indonesian students studying in the UK by providing:
        </p>
        <ul className="space-y-2 text-left text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-primary-600 font-bold">•</span>
            <span>Real-time translation at speech speed</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 font-bold">•</span>
            <span>Visual aids for complex concepts</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 font-bold">•</span>
            <span>AI-powered note-taking and enhancement</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 font-bold">•</span>
            <span>Live tutoring sessions with video calls</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 2,
    title: 'Real-time Translation',
    description: 'Translate lectures instantly as you listen',
    icon: LanguageIcon,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600">
          Click <strong>&quot;Start Listening&quot;</strong> to begin real-time translation. The system will:
        </p>
        <ul className="space-y-2 text-left text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-primary-600 font-bold">•</span>
            <span>Capture your speech or text input</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 font-bold">•</span>
            <span>Translate instantly to your target language</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 font-bold">•</span>
            <span>Highlight academic terms with definitions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 font-bold">•</span>
            <span>Show visual aids for complex concepts</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 3,
    title: 'Smart Note-Taking',
    description: 'Capture and enhance your notes with AI',
    icon: BookOpenIcon,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600">
          Use the <strong>&quot;Take Note&quot;</strong> button to capture important moments:
        </p>
        <ul className="space-y-2 text-left text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-primary-600 font-bold">•</span>
            <span>Save translations and concepts instantly</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 font-bold">•</span>
            <span>Enhance notes with AI-powered summaries</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 font-bold">•</span>
            <span>View your session history anytime</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 font-bold">•</span>
            <span>Export notes for offline study</span>
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 4,
    title: 'Live Tutoring',
    description: 'Connect with tutors for personalized help',
    icon: VideoCameraIcon,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600">
          Find tutors and book sessions:
        </p>
        <ul className="space-y-2 text-left text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-primary-600 font-bold">•</span>
            <span>Browse tutors by subject and language</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 font-bold">•</span>
            <span>Join video calls with integrated translation</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 font-bold">•</span>
            <span>Use real-time translation during sessions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 font-bold">•</span>
            <span>Track your session history</span>
          </li>
        </ul>
      </div>
    ),
  },
];

export default function WelcomeModal({ isOpen, onClose, onComplete }: WelcomeModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Mark onboarding as complete in localStorage
    localStorage.setItem('ezstudy_onboarding_complete', 'true');
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isOpen) return null;

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1800] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{step.title}</h2>
                <p className="text-sm text-gray-500">{step.description}</p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px]"
              aria-label="Skip tutorial"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {step.content}
            </motion.div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">
                  Step {currentStep + 1} of {steps.length}
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-3">
              <Button
                onClick={handlePrevious}
                variant="outline"
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              <div className="flex gap-2">
                {steps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentStep
                        ? 'bg-primary-600 w-8'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to step ${index + 1}`}
                  />
                ))}
              </div>
              <Button
                onClick={handleNext}
                variant="primary"
              >
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

