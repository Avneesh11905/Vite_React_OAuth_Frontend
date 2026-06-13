import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Check, X } from 'lucide-react';
import { Progress } from './progress';

export function PasswordStrength({ 
  password, 
  children 
}: { 
  password?: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const pwd = password || '';
  const requirements = [
    { label: 'At least 8 characters', met: pwd.length >= 8 },
    { label: 'At least 1 uppercase letter', met: /[A-Z]/.test(pwd) },
    { label: 'At least 1 lowercase letter', met: /[a-z]/.test(pwd) },
    { label: 'At least 1 number', met: /[0-9]/.test(pwd) },
    { label: 'At least 1 special character', met: /[^A-Za-z0-9]/.test(pwd) },
  ];

  const score = requirements.filter(r => r.met).length;
  const strengthPercentage = (score / requirements.length) * 100;
  
  let strengthLabel = 'Weak';
  let progressColor = 'bg-red-500';
  
  if (score >= 4) {
    strengthLabel = 'Strong';
    progressColor = 'bg-emerald-500';
  } else if (score >= 2) {
    strengthLabel = 'Fair';
    progressColor = 'bg-amber-500';
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div 
          onFocus={() => setIsOpen(true)} 
          onBlur={() => {
            // Give a tiny delay so clicks inside popover don't instantly close it if needed,
            // but for a purely visual tooltip, immediate close is fine.
            setIsOpen(false);
          }}
          className="relative w-full"
        >
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent 
        onOpenAutoFocus={(e) => e.preventDefault()} 
        side="right" 
        align="start" 
        className="w-64 space-y-3 p-4"
      >
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Password Strength</span>
            <span className={score >= 4 ? 'text-emerald-500' : score >= 2 ? 'text-amber-500' : 'text-red-500'}>
              {strengthLabel}
            </span>
          </div>
          <Progress value={strengthPercentage} className="h-1.5 w-full" indicatorClassName={progressColor} />
        </div>

        <ul className="space-y-1.5 text-sm">
          {requirements.map((req, i) => (
            <li key={i} className="flex items-center gap-2">
              {req.met ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={req.met ? 'text-foreground' : 'text-muted-foreground'}>
                {req.label}
              </span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
