import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Modal, ScrollView, Image, Alert } from 'react-native';
import { Share2, Download, X, ChevronRight } from 'lucide-react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { AppText } from '../../theme';
import { getVolumeComparison } from '../../config/ComparisonItems';

export default function ShareVolumeModal({
  visible,
  onClose,
  sessions = [],
  stats = {},
  profile = {}
}) {
  const [shareMode, setShareMode] = useState('lifetime');
  const [showSessionSelector, setShowSessionSelector] = useState(false);
  const viewShotRef = useRef();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        
        {!showSessionSelector && (
          <TouchableOpacity onPress={() => setShowSessionSelector(true)} style={{ flexDirection: 'row', backgroundColor: '#222', borderRadius: 12, padding: 14, marginBottom: 20, width: '100%', maxWidth: 360, justifyContent: 'space-between', alignItems: 'center' }}>
            <AppText weight="bold" style={{ color: '#FFF', fontSize: 14 }}>
              {shareMode === 'lifetime' ? 'Rekor Keseluruhan (Semua Waktu)' : (() => {
                const s = sessions?.find(x => x.id === shareMode);
                if (!s) return 'Pilih Sesi...';
                const dObj = new Date((s.started_at || '').replace(' ', 'T'));
                return !isNaN(dObj.getTime()) ? `Sesi: ${dObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Sesi Terpilih';
              })()}
            </AppText>
            <ChevronRight color="#888" size={20} />
          </TouchableOpacity>
        )}

        {showSessionSelector ? (
          <View style={{ width: '100%', maxWidth: 360, backgroundColor: '#1A1A1A', borderRadius: 16, flex: 1, maxHeight: 450, borderWidth: 1, borderColor: '#333', overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#333' }}>
              <AppText weight="bold" style={{ color: '#FFF', fontSize: 16 }}>Pilih Data</AppText>
              <TouchableOpacity onPress={() => setShowSessionSelector(false)}>
                <X color="#888" size={20} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={true}>
              <TouchableOpacity onPress={() => { setShareMode('lifetime'); setShowSessionSelector(false); }} style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#333', backgroundColor: shareMode === 'lifetime' ? 'rgba(212,245,60,0.1)' : 'transparent' }}>
                <AppText weight="bold" style={{ color: shareMode === 'lifetime' ? '#D4F53C' : '#FFF' }}>Rekor Keseluruhan (Semua Waktu)</AppText>
              </TouchableOpacity>
              {(sessions || []).slice(0, 30).map((s, idx) => {
                const dObj = new Date((s.started_at || '').replace(' ', 'T'));
                const label = !isNaN(dObj.getTime()) ? dObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : `Sesi ${idx+1}`;
                return (
                  <TouchableOpacity key={s.id} onPress={() => { setShareMode(s.id); setShowSessionSelector(false); }} style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#333', backgroundColor: shareMode === s.id ? 'rgba(212,245,60,0.1)' : 'transparent' }}>
                    <AppText weight="bold" style={{ color: shareMode === s.id ? '#D4F53C' : '#FFF' }}>{label}</AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : (
          <>
            <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1.0 }} style={{ borderRadius: 32, overflow: 'hidden', width: '100%', maxWidth: 360, aspectRatio: 4/5 }}>
              {(() => {
                const isLifetime = shareMode === 'lifetime';
                const selectedSession = sessions?.find(s => s.id === shareMode);

                let displayVolume = stats.totalVolume || 0;
                let dateText = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
                let subtitle = 'TOTAL ANGKATAN KESELURUHAN';

                if (!isLifetime && selectedSession) {
                  let sVol = 0;
                  (selectedSession.workout_sets || []).forEach(set => {
                    if (set.is_checked) sVol += (set.weight_kg || 0) * (set.reps || 0);
                  });
                  displayVolume = sVol;
                  const safeStr = (selectedSession.started_at || '').replace(' ', 'T');
                  const dObj = new Date(safeStr);
                  if (!isNaN(dObj.getTime())) {
                    dateText = dObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
                  }
                  subtitle = 'TOTAL ANGKATAN SESI INI';
                }

                const comp = getVolumeComparison(displayVolume);

                return (
                  <ExpoLinearGradient colors={['#1F1F24', '#0A0A0C']} style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
                    
                    {/* Top Strava-like Profile Header */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Image source={{ uri: profile.avatar_url || 'https://ui-avatars.com/api/?name=Gym+Athlete&background=D4F53C&color=000' }} style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: '#333' }} />
                      <View style={{ flex: 1 }}>
                        <AppText weight="bold" style={{ color: '#FFFFFF', fontSize: 16 }}>{profile.name || 'GymVault Athlete'}</AppText>
                        <AppText style={{ color: '#888888', fontSize: 12, marginTop: 2 }}>{dateText}</AppText>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#D4F53C' }} />
                          <AppText weight="bold" style={{ color: '#FFFFFF', letterSpacing: 1, fontSize: 12 }}>GYMVAULT</AppText>
                        </View>
                      </View>
                    </View>

                    {/* Center Floating Object */}
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginVertical: 10 }}>
                      <Image source={{ uri: comp.imageUrl }} style={{ width: '100%', height: 220, resizeMode: 'contain', 
                        shadowColor: '#D4F53C', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 30 
                      }} />
                      <AppText weight="bold" style={{ color: '#FFFFFF', fontSize: 28, textAlign: 'center', marginTop: 16, letterSpacing: 1 }}>{comp.qty}x {comp.item.toUpperCase()}</AppText>
                      <AppText style={{ color: '#888', fontSize: 12, textAlign: 'center', marginTop: 6, letterSpacing: 2 }}>{subtitle}</AppText>
                    </View>

                    {/* Bottom Stats */}
                    <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#333', paddingTop: 20, justifyContent: 'center' }}>
                      <View style={{ alignItems: 'center' }}>
                        <AppText style={{ color: '#888', fontSize: 11, marginBottom: 4, letterSpacing: 1 }}>VOLUME TOTAL</AppText>
                        <AppText weight="bold" style={{ color: '#D4F53C', fontSize: 32 }}>{displayVolume >= 1000 ? (displayVolume / 1000).toFixed(1) + 'k' : displayVolume} <AppText style={{ fontSize: 18, color: '#FFF' }}>kg</AppText></AppText>
                      </View>
                    </View>

                  </ExpoLinearGradient>
                );
              })()}
            </ViewShot>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, width: '100%', maxWidth: 360 }}>
              <TouchableOpacity
                onPress={async () => {
                  try {
                    const uri = await viewShotRef.current.capture();
                    if (await Sharing.isAvailableAsync()) {
                      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your GymVault Record!' });
                    } else {
                      Alert.alert("Error", "Sharing is not available on this device.");
                    }
                  } catch (e) {
                    console.warn("Share error", e);
                  }
                }}
                style={{ flex: 1, backgroundColor: '#D4F53C', borderRadius: 14, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 }}
              >
                <Share2 color="#000" size={20} />
                <AppText weight="bold" style={{ color: '#000000', fontSize: 16 }}>Share IG Story</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  try {
                    const uri = await viewShotRef.current.capture();
                    const { status } = await MediaLibrary.requestPermissionsAsync();
                    if (status === 'granted') {
                      await MediaLibrary.saveToLibraryAsync(uri);
                      Alert.alert("Tersimpan!", "Gambar berhasil disimpan ke Galeri HP Anda.");
                    } else {
                      Alert.alert("Error", "Izin akses galeri dibutuhkan untuk menyimpan gambar.");
                    }
                  } catch (e) {
                    console.warn("Save error", e);
                    Alert.alert("Gagal menyimpan", "Terjadi kesalahan saat memproses gambar.");
                  }
                }}
                style={{ backgroundColor: '#333', borderRadius: 14, padding: 16, alignItems: 'center', justifyContent: 'center' }}
              >
                <Download color="#FFF" size={20} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  onClose();
                  setShowSessionSelector(false);
                }}
                style={{ backgroundColor: '#222', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#333' }}
              >
                <X color="#FFF" size={24} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}
