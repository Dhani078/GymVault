import React, { useState, useEffect } from 'react';
import { View, Modal, TouchableOpacity, Image, Alert, TextInput, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { AnimatedFlashList, AnimatedScrollCard } from './AnimatedFlashList';
import { Trophy, X, Flame, Medal, User, UserPlus, UserCheck, Users, Globe } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppText, theme } from '../theme';
import { safeSelect, supabase } from '../supabaseClient';
import { useTranslation } from '../contexts/LanguageContext';

export default function SocialLeaderboardModal({ visible, onClose, currentUserProfile, currentUserStats }) {
  const { t } = useTranslation();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState([]);
  const [viewMode, setViewMode] = useState('global'); // 'global' or 'friends'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const { data, error } = await supabase.rpc('search_users', { search_query: text });
      if (!error && data) {
        const mapped = data.map((row) => ({
          id: row.user_id,
          name: row.name || 'Athlete',
          username: row.username || 'athlete',
          avatar: row.avatar_url,
          volume: Number(row.total_volume) || 0,
          streak: row.streak || 0,
          isMe: row.user_id === currentUserProfile?.id,
        }));
        setSearchResults(mapped);
      }
    } catch (e) {
      console.warn("Failed search:", e);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadFollowing();
      fetchLeaderboard();
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [visible]);

  useEffect(() => {
    setSearchQuery('');
    setSearchResults([]);
  }, [viewMode]);

  const loadFollowing = async () => {
    try {
      const stored = await AsyncStorage.getItem(`following_${currentUserProfile?.id || 'guest'}`);
      if (stored) {
        setFollowingIds(JSON.parse(stored));
      }
    } catch (e) {}
  };

  const toggleFollow = async (targetId, targetName) => {
    try {
      let newFollowing = [...followingIds];
      let isAdding = true;
      if (newFollowing.includes(targetId)) {
        newFollowing = newFollowing.filter(id => id !== targetId);
        isAdding = false;
      } else {
        newFollowing.push(targetId);
      }
      setFollowingIds(newFollowing);
      await AsyncStorage.setItem(`following_${currentUserProfile?.id || 'guest'}`, JSON.stringify(newFollowing));
      
      // The pop up when clicked!
      Alert.alert(
        t('friend_action'),
        `${targetName} ${isAdding ? t('friend_added') : t('friend_removed')}`
      );
    } catch (e) {}
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    
    try {
      // 1. Try to fetch from get_global_leaderboard RPC (bypasses profile-level RLS securely)
      const { data: rpcData, error: rpcErr } = await supabase.rpc('get_global_leaderboard');
      
      if (!rpcErr && rpcData && rpcData.length > 0) {
        let mappedData = rpcData.map((row, index) => ({
          id: row.user_id,
          name: row.name || 'Athlete',
          avatar: row.avatar_url,
          volume: Number(row.total_volume) || 0,
          streak: row.streak || 0,
          isMe: row.user_id === currentUserProfile?.id,
          rank: index + 1
        }));
        
        // Ensure current user is in the list
        if (!mappedData.find(u => u.isMe)) {
          mappedData.push({
            id: currentUserProfile?.id || 'me',
            name: currentUserProfile?.name || 'You',
            volume: currentUserStats?.totalVolume || 0,
            streak: currentUserStats?.streak || 0,
            isMe: true,
            rank: mappedData.length + 1
          });
        }
        
        // Sort and assign ranks
        mappedData.sort((a, b) => b.volume - a.volume);
        const rankedData = mappedData.map((u, i) => ({ ...u, rank: i + 1 }));
        
        setLeaderboard(rankedData);
        setLoading(false);
        return;
      }
      
      if (rpcErr) {
        console.warn("RPC fetch error, falling back to safeSelect:", rpcErr.message);
      }

      // 2. Fallback client-side aggregation (only shows current user unless RLS is relaxed)
      const { data: globalUsers, error: usersErr } = await safeSelect('users_profile');
      const { data: allSessions, error: sessErr } = await safeSelect('workout_sessions', { 
        columns: 'user_id, started_at, workout_sets(weight_kg, reps, is_checked)',
        filters: { is_completed: true } 
      });

      if (usersErr || sessErr) {
        console.warn("Failed to fetch real leaderboard data");
        setLoading(false);
        return;
      }

      const userStats = {};
      if (allSessions) {
        allSessions.forEach(session => {
          const uid = session.user_id;
          if (!userStats[uid]) {
            userStats[uid] = { volume: 0, sessions: [] };
          }
          userStats[uid].sessions.push(session.started_at);
          (session.workout_sets || []).forEach(set => {
            if (set.is_checked) {
              userStats[uid].volume += (set.weight_kg || 0) * (set.reps || 0);
            }
          });
        });
      }

      const computeStreak = (sessionDates) => {
        if (!sessionDates || sessionDates.length === 0) return 0;
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const sortedDates = sessionDates
          .map(d => {
            const dt = new Date(d);
            dt.setHours(0, 0, 0, 0);
            return dt.getTime();
          })
          .sort((a, b) => b - a);

        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() - i);
          const hasWorkout = sortedDates.includes(checkDate.getTime());
          
          if (hasWorkout) {
            streak++;
          } else if (i > 0) {
            break;
          }
        }
        return streak;
      };

      let realData = [];
      if (globalUsers) {
        realData = globalUsers.map(u => {
          const stats = userStats[u.id] || { volume: 0, sessions: [] };
          return {
            id: u.id,
            name: u.name || 'Athlete',
            volume: stats.volume,
            streak: computeStreak(stats.sessions),
            isMe: u.id === currentUserProfile?.id
          };
        });
      }

      if (!realData.find(u => u.isMe)) {
        realData.push({
          id: currentUserProfile?.id || 'me',
          name: currentUserProfile?.name || 'You',
          volume: currentUserStats?.totalVolume || 0,
          streak: currentUserStats?.streak || 0,
          isMe: true
        });
      }

      realData = realData.filter(u => u.volume > 0 || u.isMe);
      realData.sort((a, b) => b.volume - a.volume);
      const rankedData = realData.map((u, i) => ({ ...u, rank: i + 1 }));
      setLeaderboard(rankedData);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const renderRankIcon = (rank) => {
    if (rank === 1) return <Medal color="#FFD700" size={24} />;
    if (rank === 2) return <Medal color="#C0C0C0" size={24} />;
    if (rank === 3) return <Medal color="#CD7F32" size={24} />;
    return <AppText weight="bold" style={{ color: '#666', fontSize: 16, width: 24, textAlign: 'center' }}>{rank}</AppText>;
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: theme.colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: theme.colors.border, height: '80%' }}>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Trophy color="#FFD700" size={24} style={{ marginRight: 12 }} />
              <AppText weight="bold" style={{ fontSize: 20 }}>{t('leaderboard')}</AppText>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X color="#666" size={24} />
            </TouchableOpacity>
          </View>

          {/* Toggle View Mode */}
          <View style={{ flexDirection: 'row', backgroundColor: theme.colors.inputBg, borderRadius: 12, padding: 4, marginBottom: 16 }}>
            <TouchableOpacity 
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, backgroundColor: viewMode === 'global' ? theme.colors.primary : 'transparent' }}
              onPress={() => setViewMode('global')}
            >
              <Globe color={viewMode === 'global' ? '#000' : theme.colors.textMuted} size={16} style={{ marginRight: 6 }} />
              <AppText weight="bold" style={{ color: viewMode === 'global' ? '#000' : theme.colors.textMuted, fontSize: 13 }}>{t('global')}</AppText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, backgroundColor: viewMode === 'friends' ? theme.colors.primary : 'transparent' }}
              onPress={() => setViewMode('friends')}
            >
              <Users color={viewMode === 'friends' ? '#000' : theme.colors.textMuted} size={16} style={{ marginRight: 6 }} />
              <AppText weight="bold" style={{ color: viewMode === 'friends' ? '#000' : theme.colors.textMuted, fontSize: 13 }}>{t('friends')}</AppText>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={{ 
            marginBottom: 16, 
            flexDirection: 'row', 
            alignItems: 'center', 
            backgroundColor: theme.colors.inputBg, 
            borderRadius: 14, 
            borderWidth: 1, 
            borderColor: theme.colors.border, 
            paddingHorizontal: 12 
          }}>
            <TextInput
              style={{ 
                flex: 1, 
                color: theme.colors.text, 
                paddingVertical: 10, 
                fontSize: 14 
              }}
              placeholder="Cari nama atau username..."
              placeholderTextColor={theme.colors.textMuted}
              value={searchQuery}
              onChangeText={handleSearch}
              autoCapitalize="none"
            />
            {searching ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => handleSearch('')} style={{ padding: 4 }}>
                <X color={theme.colors.textMuted} size={16} />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={{ backgroundColor: theme.colors.inputBg, borderRadius: 12, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
            <AppText style={{ color: theme.colors.textMuted, fontSize: 12, width: 40, textAlign: 'center' }}>#</AppText>
            <AppText style={{ color: theme.colors.textMuted, fontSize: 12, flex: 1 }}>{t('athlete')}</AppText>
            <AppText style={{ color: theme.colors.textMuted, fontSize: 12, width: 60, textAlign: 'right' }}>{t('volume').toUpperCase()}</AppText>
            <AppText style={{ color: theme.colors.textMuted, fontSize: 12, width: 40, textAlign: 'center' }}></AppText>
          </View>

          {loading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <AppText style={{ color: theme.colors.textMuted }}>Loading rankings...</AppText>
            </View>
          ) : (
            <View style={{ flex: 1, paddingBottom: 20 }}>
              {(() => {
                let displayData = leaderboard;
                const isSearch = searchQuery.trim().length > 0;
                if (isSearch) {
                  displayData = searchResults;
                } else if (viewMode === 'friends') {
                  displayData = leaderboard.filter(u => u.isMe || followingIds.includes(u.id));
                }
                
                if (displayData.length === 0) {
                  return (
                    <View style={{ alignItems: 'center', marginTop: 40 }}>
                      <Users color={theme.colors.border} size={48} style={{ marginBottom: 12 }} />
                      <AppText style={{ color: theme.colors.textMuted, textAlign: 'center' }}>{t('no_friends')}</AppText>
                      <AppText style={{ color: theme.colors.textMuted, textAlign: 'center', fontSize: 12, marginTop: 4 }}>{t('go_to_global')}</AppText>
                    </View>
                  );
                }

                return (
                  <AnimatedFlashList
                    data={displayData}
                    keyExtractor={(item, index) => item.id + index}
                    estimatedItemSize={70}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item: user, index, scrollY }) => {
                      const isFollowing = followingIds.includes(user.id);
                      const globalRankIndex = leaderboard.findIndex(u => u.id === user.id);
                      const displayRank = isSearch 
                        ? (globalRankIndex !== -1 ? globalRankIndex + 1 : '-') 
                        : user.rank;
                      
                      return (
                        <AnimatedScrollCard index={index} itemHeight={70} scrollY={scrollY}>
                          <View 
                            style={{ 
                              flexDirection: 'row', 
                              alignItems: 'center', 
                              paddingVertical: 16, 
                              borderBottomWidth: 1, 
                              borderBottomColor: theme.colors.border,
                              backgroundColor: user.isMe ? 'rgba(204,255,0,0.05)' : 'transparent',
                              borderRadius: user.isMe ? 12 : 0,
                              paddingHorizontal: user.isMe ? 8 : 0
                            }}
                          >
                            <View style={{ width: 40, alignItems: 'center', justifyContent: 'center' }}>
                              {renderRankIcon(displayRank)}
                            </View>
                            
                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: user.isMe ? 'rgba(204,255,0,0.2)' : theme.colors.inputBg, justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' }}>
                                {user.avatar ? (
                                  <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} />
                                ) : (
                                  user.isMe ? <User color="#CCFF00" size={20} /> : <User color={theme.colors.textMuted} size={20} />
                                )}
                              </View>
                              <View style={{ flex: 1 }}>
                                <AppText weight="bold" style={{ color: user.isMe ? '#CCFF00' : theme.colors.text, fontSize: 15 }} numberOfLines={1}>{user.name}</AppText>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                  <Flame color="#FF4500" size={12} style={{ marginRight: 4 }} />
                                  <AppText style={{ color: theme.colors.textMuted, fontSize: 11 }}>{user.streak} {t('day_streak')}</AppText>
                                </View>
                              </View>
                            </View>
                            
                            <View style={{ width: 60, alignItems: 'flex-end', justifyContent: 'center' }}>
                              <AppText weight="bold" style={{ color: theme.colors.text, fontSize: 14 }}>{(user.volume / 1000).toFixed(1)}k</AppText>
                              <AppText style={{ color: theme.colors.textMuted, fontSize: 10 }}>kg</AppText>
                            </View>

                            <View style={{ width: 40, alignItems: 'flex-end', justifyContent: 'center' }}>
                              {!user.isMe && (
                                <TouchableOpacity onPress={() => toggleFollow(user.id, user.name)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isFollowing ? 'rgba(204,255,0,0.1)' : theme.colors.inputBg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: isFollowing ? 'rgba(204,255,0,0.3)' : theme.colors.border }}>
                                  {isFollowing ? <UserCheck color="#CCFF00" size={16} /> : <UserPlus color={theme.colors.textMuted} size={16} />}
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        </AnimatedScrollCard>
                      );
                    }}
                  />
                );
              })()}
            </View>
          )}

        </View>
      </View>
    </Modal>
  );
}
