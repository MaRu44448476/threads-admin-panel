'use client';

import { useEffect, useState } from 'react';

export default function StartupInitializer() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing application background services...');
        
        const response = await fetch('/api/startup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();

        if (response.ok) {
          console.log('✅ Background worker initialized:', result.status);
          setInitialized(true);
        } else {
          console.error('❌ Failed to initialize background worker:', result.error);
        }
      } catch (error) {
        console.error('❌ Startup initialization error:', error);
      }
    };

    // Only initialize once
    if (!initialized) {
      initializeApp();
    }
  }, [initialized]);

  // This component doesn't render anything visible
  return null;
}