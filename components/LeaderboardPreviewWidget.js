import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Trophy, Flame } from 'lucide-react-native';
import { AppText, theme } from '../theme';

export default function LeaderboardPreviewWidget({ leaderboardData, onShowLeaderboard }) {
  return (
    <View style={{ marginBottom: 24, backgroundColor: theme.colors.card, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: theme.colors.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Trophy color={theme.colors.primary} size={18} />
          <AppText weight="bold" style={{ fontSize: 16, color: theme.colors.text }}>Top Athletes</AppText>
        </View>
        <TouchableOpacity onPress={onShowLeaderboard} style={{ backgroundColor: 'rgba(204,255,0,0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
          <AppText weight="bold" style={{ color: theme.colors.primary, fontSize: 11 }}>View All</AppText>
        </TouchableOpacity>
      </View>

      {leaderboardData.length === 0 ? (
        <View style={{ paddingVertical: 12, alignItems: 'center' }}>
          <AppText style={{ color: theme.colors.textMuted, fontSize: 13 }}>No active athletes yet. Start a session!</AppText>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {leaderboardData.slice(0, 5).map((item, idx) => {
            const isMe = item.isMe;
            return (
              <View 
                key={item.id} 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  padding: 10, 
                  borderRadius: 14, 
                  backgroundColor: isMe ? 'rgba(204,255,0,0.06)' : theme.colors.inputBg,
                  borderWidth: 1,
                  borderColor: isMe ? 'rgba(204,255,0,0.15)' : 'transparent'
                }}
              >
                <View style={{ 
                  width: 24, 
                  height: 24, 
                  borderRadius: 12, 
                  backgroundColor: idx === 0 ? 'rgba(255,215,0,0.12)' : idx === 1 ? 'rgba(192,192,192,0.12)' : 'rgba(205,127,50,0.12)', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  marginRight: 10
                }}>
                  <AppText weight="bold" style={{ 
                    fontSize: 12, 
                    color: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : '#CD7F32' 
                  }}>
                    {idx + 1}
                  </AppText>
                </View>

                <View style={{ flex: 1 }}>
                  <AppText weight="bold" style={{ fontSize: 13, color: isMe ? theme.colors.primary : theme.colors.text }}>
                    {item.name} {isMe ? ' (You)' : ''}
                  </AppText>
                  <AppText style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 1 }}>
                    {item.volume > 1000 ? `${(item.volume / 1000).toFixed(1)}k` : item.volume} kg volume
                  </AppText>
                </View>

                {item.streak > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,69,0,0.06)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                    <Flame color="#FF4500" size={10} />
                    <AppText weight="bold" style={{ color: '#FF4500', fontSize: 10, marginLeft: 2 }}>{item.streak}</AppText>
                  </View>
                )}
              </View>
            );
          })}

          {/* Show Me at bottom if I am not in top 3 */}
          {(() => {
            const myIdx = leaderboardData.findIndex(x => x.isMe);
            if (myIdx >= 5) {
              const meItem = leaderboardData[myIdx];
              return (
                <>
                  <View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 2 }} />
                  <View 
                    style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      padding: 10, 
                      borderRadius: 14, 
                      backgroundColor: 'rgba(204,255,0,0.06)',
                      borderWidth: 1,
                      borderColor: 'rgba(204,255,0,0.15)'
                    }}
                  >
                    <View style={{ 
                      width: 24, 
                      height: 24, 
                      borderRadius: 12, 
                      backgroundColor: 'rgba(255,255,255,0.08)', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      marginRight: 10
                    }}>
                      <AppText weight="bold" style={{ fontSize: 12, color: theme.colors.textMuted }}>
                        {myIdx + 1}
                      </AppText>
                    </View>

                    <View style={{ flex: 1 }}>
                      <AppText weight="bold" style={{ fontSize: 13, color: theme.colors.primary }}>
                        {meItem.name} (You)
                      </AppText>
                      <AppText style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 1 }}>
                        {meItem.volume > 1000 ? `${(meItem.volume / 1000).toFixed(1)}k` : meItem.volume} kg volume
                      </AppText>
                    </View>

                    {meItem.streak > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,69,0,0.06)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                        <Flame color="#FF4500" size={10} />
                        <AppText weight="bold" style={{ color: '#FF4500', fontSize: 10, marginLeft: 2 }}>{meItem.streak}</AppText>
                      </View>
                    )}
                  </View>
                </>
              );
            }
            return null;
          })()}
        </View>
      )}
    </View>
  );
}
