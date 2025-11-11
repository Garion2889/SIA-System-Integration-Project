import React from 'react';
import { Check } from 'lucide-react';

interface Milestone {
  status: string;
  timestamp: string;
  completed: boolean;
}

interface MilestoneTrackerProps {
  milestones: Milestone[];
  currentStatus: string;
}

const MILESTONE_LABELS: { [key: string]: string } = {
  'created': 'Created',
  'approved': 'Approved',
  'packed': 'Packed',
  'in-transit': 'In Transit',
  'delivered': 'Delivered'
};

const MILESTONE_ORDER = ['created', 'approved', 'packed', 'in-transit', 'delivered'];

export function MilestoneTracker({ milestones, currentStatus }: MilestoneTrackerProps) {
  const getMilestoneStatus = (status: string) => {
    const milestone = milestones.find(m => m.status === status);
    if (milestone?.completed) return 'completed';
    
    const currentIndex = MILESTONE_ORDER.indexOf(currentStatus);
    const statusIndex = MILESTONE_ORDER.indexOf(status);
    
    if (statusIndex < currentIndex) return 'completed';
    if (statusIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200">
          <div 
            className="h-full bg-blue-600 transition-all duration-500"
            style={{ 
              width: `${(MILESTONE_ORDER.indexOf(currentStatus) / (MILESTONE_ORDER.length - 1)) * 100}%` 
            }}
          />
        </div>

        {MILESTONE_ORDER.map((status, index) => {
          const milestoneStatus = getMilestoneStatus(status);
          const milestone = milestones.find(m => m.status === status);
          
          return (
            <div key={status} className="flex flex-col items-center relative z-10 flex-1">
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  milestoneStatus === 'completed' 
                    ? 'bg-blue-600 text-white' 
                    : milestoneStatus === 'current'
                    ? 'bg-blue-500 text-white ring-4 ring-blue-200'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {milestoneStatus === 'completed' ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div className="mt-3 text-center">
                <div className={`text-sm ${
                  milestoneStatus === 'pending' ? 'text-gray-400' : 'text-gray-700'
                }`}>
                  {MILESTONE_LABELS[status]}
                </div>
                {milestone?.timestamp && (
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(milestone.timestamp).toLocaleDateString('en-PH')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
