import React from 'react';
import { View, TouchableOpacity, Modal } from 'react-native';
import { Flame, CheckCircle, Check, Award, Crown, X } from 'lucide-react-native';
import { AppText } from '../../theme';

export default function DailyCheckInCard({
  checkedInToday,
  checkInStreak,
  showCheckInPrompt,
  setShowCheckInPrompt,
  onCheckIn,
  cardColor,
  borderColor,
  textColor,
  textMuted
}) {
  return (
    <>
      {/* ─── Daily Check-In Card ─── */}
      <View style={{ backgroundColor: cardColor, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: borderColor, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(204,255,0,0.1)', justifyContent: 'center', alignItems: 'center' }}>
              <Flame color="#CCFF00" size={20} fill="#CCFF00" />
            </View>
            <View>
              <AppText weight="bold" style={{ color: textColor, fontSize: 15 }}>Daily Check-In</AppText>
              <AppText style={{ color: textMuted, fontSize: 11 }}>
                {checkedInToday ? 'Limit 15x AI Aktif' : 'Ambil limit 15x AI scan harian'}
              </AppText>
            </View>
          </View>
          <View style={{ backgroundColor: 'rgba(204,255,0,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(204,255,0,0.2)' }}>
            <AppText weight="bold" style={{ color: '#CCFF00', fontSize: 12 }}>{checkInStreak} Hari Streak</AppText>
          </View>
        </View>

        {/* 7-Day Journey Dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 4 }}>
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const activeDays = checkInStreak % 7 === 0 && checkInStreak > 0 ? 7 : checkInStreak % 7;
            const isCompleted = day <= activeDays;
            const isTodayUnclaimed = day === activeDays + 1 && !checkedInToday;
            const isGiftDay = day === 3 || day === 7;
            const giftLabel = day === 3 ? '+15d' : '+30d';

            return (
              <View key={day} style={{ alignItems: 'center', flex: 1 }}>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: isCompleted ? '#CCFF00' : (isTodayUnclaimed ? 'rgba(204,255,0,0.1)' : 'rgba(255,255,255,0.05)'),
                  borderWidth: isTodayUnclaimed ? 2 : 1,
                  borderColor: isCompleted || isTodayUnclaimed ? '#CCFF00' : '#444',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 6,
                  position: 'relative'
                }}>
                  {isCompleted ? (
                    <CheckCircle color="#000" size={16} />
                  ) : (
                    <AppText weight="bold" style={{ color: isTodayUnclaimed ? '#CCFF00' : '#888', fontSize: 11 }}>{day}</AppText>
                  )}

                  {isGiftDay && (
                    <View style={{
                      position: 'absolute',
                      top: -12,
                      backgroundColor: '#FF007F',
                      paddingHorizontal: 4,
                      paddingVertical: 1,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: '#000'
                    }}>
                      <AppText weight="bold" style={{ color: '#FFF', fontSize: 7 }}>{giftLabel}</AppText>
                    </View>
                  )}
                </View>
                <AppText style={{ color: isCompleted ? '#CCFF00' : '#888', fontSize: 9 }}>D{day}</AppText>
              </View>
            );
          })}
        </View>

        {/* Action Button */}
        {checkedInToday ? (
          <View
            style={{
              width: '100%',
              backgroundColor: 'rgba(255,255,255,0.03)',
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#333',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8
            }}
          >
            <CheckCircle color="#CCFF00" size={16} />
            <AppText weight="bold" style={{ color: '#CCFF00', fontSize: 13 }}>Sudah Check-In Hari Ini</AppText>
          </View>
        ) : (
          <TouchableOpacity
            onPress={onCheckIn}
            activeOpacity={0.8}
            style={{
              width: '100%',
              backgroundColor: '#CCFF00',
              paddingVertical: 12,
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#CCFF00',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4
            }}
          >
            <AppText weight="bold" style={{ color: '#000', fontSize: 13 }}>Klaim Check-In Hari Ini</AppText>
          </TouchableOpacity>
        )}
      </View>

      {/* ─── Auto Daily Check-In Prompt Modal ─── */}
      <Modal visible={showCheckInPrompt} transparent animationType="fade" onRequestClose={() => setShowCheckInPrompt(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#0A0A0C', borderRadius: 24, borderWidth: 1.5, borderColor: '#CCFF00', width: '100%', maxWidth: 360, padding: 24, alignItems: 'center', shadowColor: '#CCFF00', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 20 }}>
            
            <TouchableOpacity onPress={() => setShowCheckInPrompt(false)} style={{ position: 'absolute', top: 16, right: 16, padding: 4 }}>
              <X color="#888" size={20} />
            </TouchableOpacity>

            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(204,255,0,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, marginTop: 12, borderWidth: 1, borderColor: 'rgba(204,255,0,0.3)' }}>
              <Flame color="#CCFF00" size={32} fill="#CCFF00" />
            </View>

            <AppText weight="bold" style={{ fontSize: 22, color: '#FFF', textAlign: 'center', marginBottom: 8, letterSpacing: 0.5 }}>
              Daily Check-In
            </AppText>
            
            <AppText style={{ color: '#A1A1AA', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 10 }}>
              Klaim <AppText weight="bold" style={{ color: '#CCFF00' }}>Hari ke-{checkInStreak + 1}</AppText> untuk membuka <AppText weight="bold" style={{ color: '#FFF' }}>15x Scan AI</AppText> harian dan lanjutkan perjalanan menuju bonus Premium!
            </AppText>

            {/* Visual 7-Day Journey Preview */}
            <View style={{ width: '100%', backgroundColor: '#111115', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#222', marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                  const targetDay = checkInStreak + 1;
                  const isPast = day < targetDay;
                  const isCurrent = day === targetDay;
                  const isGift = day === 3 || day === 7;

                  return (
                    <View key={day} style={{ alignItems: 'center' }}>
                      <View style={{
                        width: 34, height: 34, borderRadius: 17,
                        backgroundColor: isPast ? '#CCFF00' : (isCurrent ? 'rgba(204,255,0,0.15)' : 'rgba(255,255,255,0.05)'),
                        borderWidth: isCurrent ? 2 : 1,
                        borderColor: isPast ? '#CCFF00' : (isCurrent ? '#CCFF00' : '#333'),
                        justifyContent: 'center', alignItems: 'center',
                        shadowColor: isCurrent ? '#CCFF00' : 'transparent',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: isCurrent ? 0.5 : 0,
                        shadowRadius: 8,
                        elevation: isCurrent ? 4 : 0
                      }}>
                        {isPast ? (
                          <Check color="#000" size={16} />
                        ) : isGift ? (
                          <Award color={isCurrent ? '#CCFF00' : '#888'} size={16} />
                        ) : (
                          <AppText weight="bold" style={{ fontSize: 13, color: isCurrent ? '#CCFF00' : '#888' }}>{day}</AppText>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={{ marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#222' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Award color="#FF007F" size={14} />
                  <AppText style={{ color: '#A1A1AA', fontSize: 12 }}>Hari 3: <AppText weight="bold" style={{ color: '#FF007F' }}>Pro Trial 15 Hari</AppText></AppText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Crown color="#CCFF00" size={14} />
                  <AppText style={{ color: '#A1A1AA', fontSize: 12 }}>Hari 7: <AppText weight="bold" style={{ color: '#CCFF00' }}>Pro Trial 30 Hari</AppText></AppText>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                setShowCheckInPrompt(false);
                onCheckIn();
              }}
              style={{
                backgroundColor: '#CCFF00',
                width: '100%',
                paddingVertical: 14,
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#CCFF00',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4
              }}
            >
              <AppText weight="bold" style={{ color: '#000', fontSize: 15 }}>Klaim Sekarang</AppText>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowCheckInPrompt(false)} style={{ marginTop: 14 }}>
              <AppText style={{ color: '#666', fontSize: 13 }}>Nanti Saja</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
