import { View, Text } from 'react-native';

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
];

function colorFromName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

interface Props {
  name: string;
  size?: number;
}

export function Avatar({ name, size = 48 }: Props) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const bg = colorFromName(name);
  const fontSize = size * 0.38;

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg }}
      className="items-center justify-center"
    >
      <Text style={{ fontSize, color: '#fff', fontWeight: '700' }}>{initials}</Text>
    </View>
  );
}
