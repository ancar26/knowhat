import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { EMPTY_PROFILE, UserProfile } from './types/profile';
import { loadProfile, saveProfile } from './utils/storage';
import Onboarding1 from './screens/Onboarding1';
import Onboarding2 from './screens/Onboarding2';
import Onboarding3 from './screens/Onboarding3';
import Scanner from './screens/Scanner';

type Screen = 'loading' | 'onboarding1' | 'onboarding2' | 'onboarding3' | 'scanner';

export default function App() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);

  useEffect(() => {
    loadProfile().then(saved => {
      if (saved) {
        setProfile(saved);
        setScreen('scanner');
      } else {
        setScreen('onboarding1');
      }
    });
  }, []);

  const patch = (p: Partial<UserProfile>) => setProfile(prev => ({ ...prev, ...p }));

  const finishOnboarding = async () => {
    await saveProfile(profile);
    setScreen('scanner');
  };

  if (screen === 'loading') return <View style={{ flex: 1, backgroundColor: '#f8f9fa' }} />;

  if (screen === 'onboarding1') return <Onboarding1 profile={profile} onChange={patch} onNext={() => setScreen('onboarding2')} />;
  if (screen === 'onboarding2') return <Onboarding2 profile={profile} onChange={patch} onNext={() => setScreen('onboarding3')} onBack={() => setScreen('onboarding1')} />;
  if (screen === 'onboarding3') return <Onboarding3 profile={profile} onChange={patch} onFinish={finishOnboarding} onBack={() => setScreen('onboarding2')} />;

  return <Scanner profile={profile} />;
}
