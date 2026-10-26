import { View, ScrollView, Image } from 'react-native';
import { Users, Flame } from 'lucide-react-native';
import { AppText, theme } from '../theme';

export default function CommunitySocialFeedWidget({ leaderboardData }) {
  return (
    <View style={{ marginTop: 24, marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Users color={theme.colors.text} size={20} />
          <AppText weight="bold" style={{ fontSize: 18 }}>Aktivitas Teman</AppText>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24, paddingHorizontal: 24 }}>
        {leaderboardData && leaderboardData.length > 0 ? (
          leaderboardData.filter(user => user.volume > 0).slice(0, 6).map(feed => {
            let action = "aktif menyelesaikan latihan";
            if (feed.streak >= 3) action = `konsisten berlatih (streak ${feed.streak} hari)`;
            else if (feed.volume > 10000) action = "mengangkat beban tinggi";

            return (
              <View key={feed.id} style={{ 
                width: 280, marginRight: 16, padding: 16, backgroundColor: theme.colors.card, 
                borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', gap: 12
              }}>
                <Image source={{ uri: feed.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(feed.name)}&background=random&color=fff` }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                <View style={{ flex: 1 }}>
                  <AppText weight="bold" style={{ fontSize: 14, color: theme.colors.text, marginBottom: 2 }}>{feed.name} {feed.isMe && '(Anda)'}</AppText>
                  <AppText style={{ fontSize: 13, color: theme.colors.textMuted, marginBottom: 8, lineHeight: 18 }}>{action}</AppText>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Flame color={theme.colors.primary} size={13} />
                      <AppText weight="bold" style={{ fontSize: 12, color: theme.colors.primary }}>{feed.volume >= 1000 ? (feed.volume/1000).toFixed(1) + 'k' : feed.volume} kg</AppText>
                    </View>
                    <AppText style={{ fontSize: 11, color: theme.colors.textMuted }}>Hari ini</AppText>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <AppText style={{ color: theme.colors.textMuted, marginVertical: 20 }}>Belum ada aktivitas komunitas hari ini.</AppText>
        )}
        <View style={{ width: 24 }} />
      </ScrollView>
    </View>
  );
}
