# GymVault Offline Sync Engine & Data Persistence Specification

Author: Dhani078  
Version: 2.5.0  
Status: Production Certified  
Last Updated: 2026-10-31  

---

## 1. Executive Architecture Summary

GymVault operates on a strict Offline-First architecture. In underground basement gyms and strength facilities with poor or nonexistent cellular connectivity, lifters must be able to log sets, adjust weights, compute barbell plate distributions, and track workouts without network latency or request failures.

The Offline Sync Engine coordinates local device storage (AsyncStorage on mobile, localStorage on web) with cloud persistence in Supabase PostgreSQL. Every write operation writes immediately to local storage before enqueueing an asynchronous background sync job.

---

## 2. Storage Topology & Partitioning

Local persistence is partitioned into four isolated namespaces:

1. Workout Sessions Queue
- Storage Key: @gymvault_offline_workout_queue
- Purpose: Stores completed workout headers and raw set data pending cloud insertion.
- Data Structure: Array of serialized session objects containing UUID, split name, start timestamp, completion timestamp, and child sets.

2. Nutrition Logs Queue
- Storage Key: @gymvault_offline_nutrition_queue
- Purpose: Queues manual food logs and AI Vision scanned meals recorded while offline.
- Data Structure: Array of food entry objects with calories, protein, carbs, fats, and creation timestamps.

3. Personal Records & Historical Maxes Cache
- Storage Key: @gymvault_prs_v2_[user_id]
- Purpose: Instant O(1) lookup of personal records to evaluate progressive overload recommendations and new PR alerts without querying Supabase during active sets.

4. Check-in & Streak State
- Storage Key: checkin_streak_[user_id]
- Purpose: Tracks consecutive workout days and unlocks daily AI workout routine generations.

---

## 3. Data Flow & Transaction Lifecycle

### Phase 1: Local Capture
1. User marks a set complete in LoggerScreen.
2. The UI state updates optimistically in zero milliseconds.
3. The set is serialized to AsyncStorage under the active session buffer.
4. Audio cue and haptic buzzer fire on the UI thread without blocking storage I/O.

### Phase 2: Session Finalization
1. User taps Selesai Latihan (Finish Workout).
2. The engine computes total session volume, total reps, average intensity, and duration.
3. If the network is available, safeBatchInsert commits the session and sets in a single transaction.
4. If network request fails or device is offline, the entire payload is appended to the offline sync queue.
5. OfflineSyncBanner mounts automatically and displays pending queue item count.

### Phase 3: Background Reconciliation & Retry Protocol
1. Connection Monitor polls connectivity every 30 seconds and listens to AppState foreground events.
2. When connectivity is restored, syncOfflineQueue processes items sequentially using FIFO ordering.
3. For each queued workout:
   - Validates session UUID and user authorization token.
   - Executes upsert to workout_sessions.
   - Executes bulk insert to workout_sets.
   - On HTTP 200/201 confirmation, item is purged from local queue.
   - On HTTP 400 error (malformed data), item is archived to dead-letter storage for manual inspection.
   - On HTTP 500 error (temporary cloud downtime), queue retains item and applies exponential backoff (2s, 4s, 8s, 16s).

---

## 4. Conflict Resolution Strategy

GymVault employs a Client-Wins Timestamp Monotonic strategy for workout sets:
- Every set carries an immutable client-generated UUID and microsecond timestamp.
- If a sync retry occurs for an already-inserted session, Supabase safeUpsert utilizes ON CONFLICT (id) DO UPDATE.
- Duplicate set rows are impossible due to compound unique constraints on (session_id, set_index).

---

## 5. Security & Isolation

- Row Level Security: When offline items sync, the Supabase client sends the athlete bearer token. The database evaluates auth.uid() = user_id for every row.
- Zero Secret Leaks: Local storage never caches service role keys or administrative tokens. Only athlete-owned session records are readable.
