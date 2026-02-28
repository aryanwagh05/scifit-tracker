import type { ComponentType } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Camera, ClipboardList, Home, Search, User } from '@tamagui/lucide-icons';
import type { RouteKey } from '@/src/app/navigation/types';
import { styles } from '@/src/shared/ui/styles';

export function BottomNav({ route, setRoute }: { route: RouteKey; setRoute: (value: RouteKey) => void }) {
  return (
    <View style={styles.bottomNavWrap}>
      <View style={styles.bottomNav}>
        <BottomNavItem label="Home" icon={Home} active={route === 'dashboard'} onPress={() => setRoute('dashboard')} />
        <BottomNavItem label="Login" icon={User} active={route === 'login'} onPress={() => setRoute('login')} />
        <BottomNavItem label="Profile" icon={ClipboardList} active={route === 'profile'} onPress={() => setRoute('profile')} />
        <BottomNavItem label="Workout" icon={ClipboardList} active={route === 'workoutLog'} onPress={() => setRoute('workoutLog')} />
        <BottomNavItem label="Coach" icon={Camera} active={route === 'aiCoach'} onPress={() => setRoute('aiCoach')} />
        <BottomNavItem label="RAG" icon={Search} active={route === 'raglab'} onPress={() => setRoute('raglab')} />
      </View>
    </View>
  );
}

function BottomNavItem({
  label,
  icon: Icon,
  active,
  onPress
}: {
  label: string;
  icon: ComponentType<any>;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.bottomNavItem}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Icon size={20} color={active ? '#c05f3a' : '#9a8071'} />
      <Text style={[styles.bottomNavText, active && styles.bottomNavTextActive]}>{label}</Text>
    </Pressable>
  );
}
