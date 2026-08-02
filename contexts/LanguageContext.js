import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TRANSLATIONS = {
  en: {
    cancel: "Cancel", save: "Save", edit: "Edit", ok: "OK", search: "Search",
    good_morning: "Good Morning", good_afternoon: "Good Afternoon", good_evening: "Good Evening",
    quick_start: "Quick Start Workout", check_cns: "Check Body Readiness (Optional)",
    active_streak: "Active Streak", days: "days", dashboard: "DASHBOARD", ready_to_break_limits: "Ready to break limits?",
    your_overview: "Your Overview", last_workout: "Last Workout", this_week: "This Week",
    history_title: "Workout History", completed: "Completed", volume: "Volume", sets: "Sets",
    no_history: "No workout history yet. Start lifting!",
    search_exercises: "Search exercises...", filter_location: "Location (Home vs Gym)", filter_level: "Experience Level", filter_muscle: "Target Muscle",
    filtered_results: "Filtered Results", popular_exercises: "Popular Exercises", add_to_logger: "Add to Logger", instructions: "Instructions",
    active_session: "Active Session", add_exercise: "Add Exercise", finish_workout: "Finish Workout",
    set: "Set", weight_kg: "kg", reps: "reps", rest: "Rest",
    system_error: "System Error", biometrics: "Biometrics", save_all: "Save All", edit_profile: "Edit Profile",
    weight: "WEIGHT", height: "HEIGHT", bmi: "BMI", ai_coach: "AI COACH ENGINE", recovery_status: "Recovery Status", injury_risk: "Injury Risk",
    lifetime_stats: "LIFETIME STATS", total_sessions: "Total Sessions", volume_kg: "Volume (kg)",
    settings: "Settings", appearance: "APPEARANCE & APP", dark_mode: "Dark Mode",
    notifications: "Push Notifications", privacy: "Privacy Mode", language: "Language", units: "Weight Units",
    data_privacy: "DATA & PRIVACY", export_data: "Export Workout Data", clear_cache: "Clear App Cache",
    account: "ACCOUNT", change_avatar: "Change Avatar", edit_name: "Edit Profile Name", reset_password: "Reset Password", logout: "Log Out",
    placeholder_name: "Your Name", toast_avatar_success: "Avatar updated!", toast_logout_fail: "Logout failed.",
    alert_logout_title: "Log Out", alert_logout_msg: "Are you sure you want to log out?",
    toast_pass_req: "Email not found.", toast_pass_sent: "Password reset email sent! Check your inbox.",
    edit_profile_title: "Edit Profile", name_label: "Display Name", weight_label: "Weight (kg)", height_label: "Height (cm)",
    units_title: "Weight Units", unit_metric: "Metric (kg / cm)", unit_imperial: "Imperial (lbs / in)",
    export_title: "Export Data", export_confirm: "Download your workout data as JSON?", export_success: "Data exported successfully!", export_empty: "No workout data to export.",
    notif_reminder: "Time to train! 💪", notif_body: "Your muscles are waiting. Let's crush it today!",
    alert_cancel: "Cancel", confirm: "Confirm",
    leaderboard: "Leaderboard", global: "Global", friends: "Friends", rank: "RANK", athlete: "ATHLETE", 
    day_streak: "day streak", kg_lifted: "kg lifted", no_friends: "No friends yet.", go_to_global: "Go to Global to add friends!",
    friend_added: "added to friends!", friend_removed: "removed from friends.", friend_action: "Friend Update",
    trophy_cabinet: "TROPHY CABINET", trophy_consistency: "Consistency King", trophy_consistency_desc: "10+ Workouts",
    trophy_elephant: "The Elephant", trophy_elephant_desc: "Lift 10,000kg+", trophy_owl: "Night Owl", trophy_owl_desc: "First Workout",
    history_desc: "View all your past sessions", injury_optimal_fallback: "Safe to increase weight.", deload_optimal_fallback: "Body condition is optimal.", toast_local_cache_cleared: "Local cache cleared. App will run faster now.", toast_workout_logs_are_now: "Workout logs are now private.", toast_dark_mode_activated: "Dark mode activated.", toast_notifications_off: "Notifications OFF", toast_notifications_on__ch: "Notifications ON (Check system permissions)", toast_notifications_on: "Notifications ON", toast_permission_to_access: "Permission to access camera roll is required!", toast_profile_updated_succ: "Profile updated successfully!", toast_please_fill_all_fiel: "Please fill all fields correctly.", toast_lang_changed: "Language changed to", share_to_socials: "Share to Socials"
  },
  id: {
    cancel: "Batal", save: "Simpan", edit: "Edit", ok: "OK", search: "Cari",
    good_morning: "Selamat Pagi", good_afternoon: "Selamat Siang", good_evening: "Selamat Malam",
    quick_start: "Mulai Latihan Cepat", check_cns: "Cek Kesiapan Tubuh (Opsional)",
    active_streak: "Rekor Aktif", days: "hari", dashboard: "BERANDA", ready_to_break_limits: "Siap hancurkan batasanmu?",
    your_overview: "Ringkasanmu", last_workout: "Latihan Terakhir", this_week: "Minggu Ini",
    history_title: "Riwayat Latihan", completed: "Selesai", volume: "Beban", sets: "Set",
    no_history: "Belum ada riwayat latihan. Ayo mulai!",
    search_exercises: "Cari latihan...", filter_location: "Lokasi Latihan", filter_level: "Tingkat Kesulitan", filter_muscle: "Target Otot",
    filtered_results: "Hasil Filter", popular_exercises: "Latihan Populer", add_to_logger: "Tambah ke Logger", instructions: "Instruksi",
    active_session: "Sesi Berjalan", add_exercise: "Tambah Latihan", finish_workout: "Selesai Latihan",
    set: "Set", weight_kg: "kg", reps: "reps", rest: "Istirahat",
    system_error: "Kesalahan Sistem", biometrics: "Biometrik", save_all: "Simpan Semua", edit_profile: "Edit Profil",
    weight: "BERAT", height: "TINGGI", bmi: "BMI", ai_coach: "MESIN PELATIH AI", recovery_status: "Status Pemulihan", injury_risk: "Risiko Cedera",
    lifetime_stats: "STATISTIK SEUMUR HIDUP", total_sessions: "Total Sesi", volume_kg: "Volume (kg)",
    settings: "Pengaturan", appearance: "TAMPILAN & APLIKASI", dark_mode: "Mode Gelap",
    notifications: "Notifikasi", privacy: "Mode Privasi", language: "Bahasa", units: "Satuan Berat",
    data_privacy: "DATA & PRIVASI", export_data: "Ekspor Data Latihan", clear_cache: "Bersihkan Cache",
    account: "AKUN", change_avatar: "Ganti Avatar", edit_name: "Ubah Nama Profil", reset_password: "Atur Ulang Sandi", logout: "Keluar",
    placeholder_name: "Nama Anda", toast_avatar_success: "Avatar diperbarui!", toast_logout_fail: "Gagal keluar.",
    alert_logout_title: "Keluar", alert_logout_msg: "Yakin ingin keluar?",
    toast_pass_req: "Email tidak ditemukan.", toast_pass_sent: "Email reset sandi terkirim! Cek kotak masuk.",
    edit_profile_title: "Edit Profil", name_label: "Nama Tampilan", weight_label: "Berat (kg)", height_label: "Tinggi (cm)",
    units_title: "Satuan Berat", unit_metric: "Metrik (kg / cm)", unit_imperial: "Imperial (lbs / in)",
    export_title: "Ekspor Data", export_confirm: "Unduh data latihan sebagai JSON?", export_success: "Data berhasil diekspor!", export_empty: "Tidak ada data latihan.",
    notif_reminder: "Waktunya latihan! 💪", notif_body: "Ototmu sudah menunggu. Ayo hancurkan hari ini!",
    alert_cancel: "Batal", confirm: "Konfirmasi",
    leaderboard: "Peringkat", global: "Global", friends: "Teman", rank: "RANKING", athlete: "ATLET", 
    day_streak: "hari beruntun", kg_lifted: "kg beban", no_friends: "Belum ada teman.", go_to_global: "Buka Global untuk tambah teman!",
    friend_added: "ditambahkan ke teman!", friend_removed: "dihapus dari teman.", friend_action: "Pembaruan Teman",
    trophy_cabinet: "KABINET PIALA", trophy_consistency: "Raja Konsisten", trophy_consistency_desc: "10+ Latihan",
    trophy_elephant: "Sang Gajah", trophy_elephant_desc: "Angkat 10.000kg+", trophy_owl: "Burung Hantu", trophy_owl_desc: "Latihan Pertama",
    history_desc: "Lihat semua sesi latihan Anda", injury_optimal_fallback: "Peningkatan beban Anda aman.", deload_optimal_fallback: "Kondisi tubuh sangat prima.", toast_local_cache_cleared: "Cache memori aplikasi dibersihkan. Aplikasi akan terasa lebih cepat.", toast_workout_logs_are_now: "Log latihan Anda sekarang privat.", toast_dark_mode_activated: "Mode Gelap diaktifkan.", toast_notifications_off: "Notifikasi dimatikan", toast_notifications_on__ch: "Notifikasi ON (Cek izin perangkat)", toast_notifications_on: "Notifikasi diaktifkan", toast_permission_to_access: "Izin akses galeri dibutuhkan!", toast_profile_updated_succ: "Profil berhasil disimpan!", toast_please_fill_all_fiel: "Mohon isi semua data dengan benar.", toast_lang_changed: "Bahasa diubah ke", share_to_socials: "Bagikan ke Medsos"
  },
  es: {
    cancel: "Cancelar", save: "Guardar", edit: "Editar", ok: "Aceptar", search: "Buscar",
    good_morning: "Buenos Días", good_afternoon: "Buenas Tardes", good_evening: "Buenas Noches",
    quick_start: "Inicio Rápido", check_cns: "Comprobar el cuerpo",
    active_streak: "Racha Activa", days: "días", dashboard: "PANEL", ready_to_break_limits: "¿Listo para romper límites?",
    your_overview: "Tu Resumen", last_workout: "Último Entrenamiento", this_week: "Esta Semana",
    history_title: "Historial", completed: "Completado", volume: "Volumen", sets: "Series",
    no_history: "No hay historial todavía. ¡Empieza a entrenar!",
    search_exercises: "Buscar ejercicios...", filter_location: "Ubicación", filter_level: "Nivel de Experiencia", filter_muscle: "Músculo Objetivo",
    filtered_results: "Resultados Filtrados", popular_exercises: "Ejercicios Populares", add_to_logger: "Añadir", instructions: "Instrucciones",
    active_session: "Sesión Activa", add_exercise: "Añadir Ejercicio", finish_workout: "Terminar Entrenamiento",
    set: "Serie", weight_kg: "kg", reps: "reps", rest: "Descanso",
    system_error: "Error del Sistema", biometrics: "Biometría", save_all: "Guardar Todo", edit_profile: "Editar Perfil",
    weight: "PESO", height: "ALTURA", bmi: "IMC", ai_coach: "ENTRENADOR IA", recovery_status: "Estado de Recuperación", injury_risk: "Riesgo de Lesión",
    lifetime_stats: "ESTADÍSTICAS GLOBALES", total_sessions: "Sesiones Totales", volume_kg: "Volumen (kg)",
    settings: "Ajustes", appearance: "APARIENCIA Y APP", dark_mode: "Modo Oscuro",
    notifications: "Notificaciones", privacy: "Modo Privado", language: "Idioma", units: "Unidades",
    data_privacy: "DATOS Y PRIVACIDAD", export_data: "Exportar Datos", clear_cache: "Borrar Caché",
    account: "CUENTA", change_avatar: "Cambiar Avatar", edit_name: "Editar Nombre", reset_password: "Restablecer Contraseña", logout: "Cerrar Sesión",
    placeholder_name: "Tu Nombre", toast_avatar_success: "¡Avatar actualizado!", toast_logout_fail: "Error al cerrar sesión.",
    alert_logout_title: "Cerrar Sesión", alert_logout_msg: "¿Estás seguro de que quieres cerrar sesión?",
    toast_pass_req: "Correo no encontrado.", toast_pass_sent: "¡Correo de restablecimiento enviado!",
    edit_profile_title: "Editar Perfil", name_label: "Nombre", weight_label: "Peso (kg)", height_label: "Altura (cm)",
    units_title: "Unidades de Peso", unit_metric: "Métrico (kg/cm)", unit_imperial: "Imperial (lbs/in)",
    export_title: "Exportar Datos", export_confirm: "¿Descargar datos?", export_success: "¡Datos exportados!", export_empty: "No hay datos.",
    notif_reminder: "¡Hora de entrenar! 💪", notif_body: "Tus músculos esperan. ¡Vamos!",
    alert_cancel: "Cancelar", confirm: "Confirmar",
    leaderboard: "Clasificación", global: "Global", friends: "Amigos", rank: "RANGO", athlete: "ATLETA", 
    day_streak: "días seguidos", kg_lifted: "kg levantados", no_friends: "Sin amigos aún.", go_to_global: "¡Ve a Global!",
    friend_added: "añadido a amigos!", friend_removed: "eliminado de amigos.", friend_action: "Actualización de amigos",
    trophy_cabinet: "GABINETE DE TROFEOS", trophy_consistency: "Rey Consistente", trophy_consistency_desc: "10+ Entrenamientos",
    trophy_elephant: "El Elefante", trophy_elephant_desc: "10,000kg+", trophy_owl: "Búho Nocturno", trophy_owl_desc: "Primer Entrenamiento",
    history_desc: "Mira tus sesiones pasadas", injury_optimal_fallback: "Safe to increase weight.", deload_optimal_fallback: "Body condition is optimal.", toast_local_cache_cleared: "Local cache cleared. App will run faster now.", toast_workout_logs_are_now: "Workout logs are now private.", toast_dark_mode_activated: "Dark mode activated.", toast_notifications_off: "Notifications OFF", toast_notifications_on__ch: "Notifications ON (Check system permissions)", toast_notifications_on: "Notifications ON", toast_permission_to_access: "Permission to access camera roll is required!", toast_profile_updated_succ: "Profile updated successfully!", toast_please_fill_all_fiel: "Please fill all fields correctly.", toast_lang_changed: "Idioma cambiado a", share_to_socials: "Compartir a Redes"
  },
  fr: {
    cancel: "Annuler", save: "Enregistrer", edit: "Modifier", ok: "D'accord", search: "Rechercher",
    good_morning: "Bonjour", good_afternoon: "Bon Après-midi", good_evening: "Bonsoir",
    quick_start: "Démarrage Rapide", check_cns: "Vérifier la récupération",
    active_streak: "Série Active", days: "jours", dashboard: "TABLEAU DE BORD", ready_to_break_limits: "Prêt à dépasser les limites ?",
    your_overview: "Votre Aperçu", last_workout: "Dernier Entraînement", this_week: "Cette Semaine",
    history_title: "Historique d'Entraînement", completed: "Terminé", volume: "Volume", sets: "Séries",
    no_history: "Aucun historique. Commencez à soulever !",
    search_exercises: "Rechercher des exercices...", filter_location: "Lieu", filter_level: "Niveau", filter_muscle: "Muscle Cible",
    filtered_results: "Résultats Filtrés", popular_exercises: "Exercices Populaires", add_to_logger: "Ajouter", instructions: "Instructions",
    active_session: "Session Active", add_exercise: "Ajouter Exercice", finish_workout: "Terminer",
    set: "Série", weight_kg: "kg", reps: "réps", rest: "Repos",
    system_error: "Erreur Système", biometrics: "Biométrie", save_all: "Tout Enregistrer", edit_profile: "Modifier le Profil",
    weight: "POIDS", height: "TAILLE", bmi: "IMC", ai_coach: "COACH IA", recovery_status: "Statut de Récupération", injury_risk: "Risque de Blessure",
    lifetime_stats: "STATISTIQUES GLOBALES", total_sessions: "Sessions Totales", volume_kg: "Volume (kg)",
    settings: "Paramètres", appearance: "APPARENCE", dark_mode: "Mode Sombre",
    notifications: "Notifications", privacy: "Mode Privé", language: "Langue", units: "Unités",
    data_privacy: "DONNÉES", export_data: "Exporter les Données", clear_cache: "Vider le Cache",
    account: "COMPTE", change_avatar: "Changer d'Avatar", edit_name: "Modifier le Nom", reset_password: "Réinitialiser Mot de Passe", logout: "Déconnexion",
    placeholder_name: "Votre Nom", toast_avatar_success: "Avatar mis à jour !", toast_logout_fail: "Échec de la déconnexion.",
    alert_logout_title: "Déconnexion", alert_logout_msg: "Voulez-vous vraiment vous déconnecter ?",
    toast_pass_req: "E-mail introuvable.", toast_pass_sent: "E-mail envoyé !",
    edit_profile_title: "Modifier le Profil", name_label: "Nom", weight_label: "Poids (kg)", height_label: "Taille (cm)",
    units_title: "Unités de Poids", unit_metric: "Métrique (kg/cm)", unit_imperial: "Impérial (lbs/in)",
    export_title: "Exporter les Données", export_confirm: "Télécharger les données ?", export_success: "Données exportées !", export_empty: "Aucune donnée.",
    notif_reminder: "C'est l'heure ! 💪", notif_body: "Vos muscles vous attendent.",
    alert_cancel: "Annuler", confirm: "Confirmer",
    leaderboard: "Classement", global: "Mondial", friends: "Amis", rank: "RANG", athlete: "ATHLÈTE", 
    day_streak: "jours de suite", kg_lifted: "kg soulevés", no_friends: "Pas d'amis.", go_to_global: "Allez sur Mondial !",
    friend_added: "ajouté aux amis !", friend_removed: "retiré des amis.", friend_action: "Mise à jour des amis",
    trophy_cabinet: "ARMOIRE À TROPHÉES", trophy_consistency: "Roi de la Constance", trophy_consistency_desc: "10+ Séances",
    trophy_elephant: "L'Éléphant", trophy_elephant_desc: "10 000kg+", trophy_owl: "Oiseau de Nuit", trophy_owl_desc: "Première Séance",
    history_desc: "Voir vos séances passées", injury_optimal_fallback: "Safe to increase weight.", deload_optimal_fallback: "Body condition is optimal.", toast_local_cache_cleared: "Local cache cleared. App will run faster now.", toast_workout_logs_are_now: "Workout logs are now private.", toast_dark_mode_activated: "Dark mode activated.", toast_notifications_off: "Notifications OFF", toast_notifications_on__ch: "Notifications ON (Check system permissions)", toast_notifications_on: "Notifications ON", toast_permission_to_access: "Permission to access camera roll is required!", toast_profile_updated_succ: "Profile updated successfully!", toast_please_fill_all_fiel: "Please fill all fields correctly.", toast_lang_changed: "Langue changée en", share_to_socials: "Partager"
  },
  ja: {
    cancel: "キャンセル", save: "保存", edit: "編集", ok: "OK", search: "検索",
    good_morning: "おはようございます", good_afternoon: "こんにちは", good_evening: "こんばんは",
    quick_start: "クイックスタート", check_cns: "体調チェック",
    active_streak: "継続記録", days: "日", dashboard: "ダッシュボード", ready_to_break_limits: "限界を超える準備はいいですか？",
    your_overview: "概要", last_workout: "前回のトレーニング", this_week: "今週",
    history_title: "トレーニング履歴", completed: "完了", volume: "総負荷", sets: "セット",
    no_history: "履歴がありません。トレーニングを始めましょう！",
    search_exercises: "エクササイズを検索...", filter_location: "場所", filter_level: "レベル", filter_muscle: "対象筋肉",
    filtered_results: "絞り込み結果", popular_exercises: "人気のエクササイズ", add_to_logger: "追加", instructions: "手順",
    active_session: "セッション中", add_exercise: "エクササイズ追加", finish_workout: "終了",
    set: "セット", weight_kg: "kg", reps: "回", rest: "休憩",
    system_error: "システムエラー", biometrics: "生体データ", save_all: "すべて保存", edit_profile: "プロフィール編集",
    weight: "体重", height: "身長", bmi: "BMI", ai_coach: "AIコーチ", recovery_status: "回復状況", injury_risk: "ケガのリスク",
    lifetime_stats: "累計データ", total_sessions: "合計セッション", volume_kg: "総負荷 (kg)",
    settings: "設定", appearance: "外観", dark_mode: "ダークモード",
    notifications: "通知", privacy: "プライバシーモード", language: "言語", units: "単位",
    data_privacy: "データとプライバシー", export_data: "データ書き出し", clear_cache: "キャッシュ消去",
    account: "アカウント", change_avatar: "アバター変更", edit_name: "名前の変更", reset_password: "パスワードリセット", logout: "ログアウト",
    placeholder_name: "名前", toast_avatar_success: "アバターを更新しました！", toast_logout_fail: "ログアウトに失敗しました。",
    alert_logout_title: "ログアウト", alert_logout_msg: "ログアウトしてもよろしいですか？",
    toast_pass_req: "メールが見つかりません。", toast_pass_sent: "パスワードリセットメールを送信しました！",
    edit_profile_title: "プロフィール編集", name_label: "表示名", weight_label: "体重 (kg)", height_label: "身長 (cm)",
    units_title: "重量単位", unit_metric: "メトリック (kg / cm)", unit_imperial: "インペリアル (lbs / in)",
    export_title: "データ書き出し", export_confirm: "ダウンロードしますか？", export_success: "完了！", export_empty: "データがありません。",
    notif_reminder: "トレーニングの時間です！💪", notif_body: "筋肉が待っています。今日も頑張りましょう！",
    alert_cancel: "キャンセル", confirm: "確認",
    leaderboard: "ランキング", global: "グローバル", friends: "友達", rank: "ランク", athlete: "アスリート", 
    day_streak: "日連続", kg_lifted: "kg 持ち上げ", no_friends: "友達がいません。", go_to_global: "グローバルから追加！",
    friend_added: "追加しました！", friend_removed: "削除しました。", friend_action: "更新",
    trophy_cabinet: "トロフィー", trophy_consistency: "継続王", trophy_consistency_desc: "10回以上",
    trophy_elephant: "象", trophy_elephant_desc: "10,000kg+", trophy_owl: "フクロウ", trophy_owl_desc: "初回トレーニング",
    history_desc: "過去のセッションを見る", injury_optimal_fallback: "Safe to increase weight.", deload_optimal_fallback: "Body condition is optimal.", toast_local_cache_cleared: "Local cache cleared. App will run faster now.", toast_workout_logs_are_now: "Workout logs are now private.", toast_dark_mode_activated: "Dark mode activated.", toast_notifications_off: "Notifications OFF", toast_notifications_on__ch: "Notifications ON (Check system permissions)", toast_notifications_on: "Notifications ON", toast_permission_to_access: "Permission to access camera roll is required!", toast_profile_updated_succ: "Profile updated successfully!", toast_please_fill_all_fiel: "Please fill all fields correctly.", toast_lang_changed: "言語が変更されました:", share_to_socials: "SNSでシェア"
  },
  it: { cancel: 'Annulla', save: 'Salva', edit: 'Modifica', ok: 'OK', search: 'Cerca', good_morning: 'Buongiorno', good_afternoon: 'Buon pomeriggio', good_evening: 'Buonasera', quick_start: 'Avvio Rapido', check_cns: 'Verifica recupero', active_streak: 'Serie attiva', days: 'giorni', dashboard: 'PANNELLO', ready_to_break_limits: 'Pronto a superare i limiti?', your_overview: 'La tua panoramica', last_workout: 'Ultimo Allenamento', this_week: 'Questa Settimana', history_title: 'Cronologia', completed: 'Completato', volume: 'Volume', sets: 'Serie', no_history: 'Nessuna cronologia. Inizia!', search_exercises: 'Cerca esercizi...', filter_location: 'Luogo', filter_level: 'Livello', filter_muscle: 'Muscolo Obiettivo', filtered_results: 'Risultati', popular_exercises: 'Esercizi Popolari', add_to_logger: 'Aggiungi', instructions: 'Istruzioni', active_session: 'Sessione Attiva', add_exercise: 'Aggiungi Esercizio', finish_workout: 'Termina', set: 'Serie', weight_kg: 'kg', reps: 'rip', rest: 'Riposo', system_error: 'Errore di Sistema', biometrics: 'Biometria', save_all: 'Salva tutto', edit_profile: 'Modifica Profilo', weight: 'PESO', height: 'ALTEZZA', bmi: 'IMC', ai_coach: 'COACH IA', recovery_status: 'Stato Recupero', injury_risk: 'Rischio Infortunio', lifetime_stats: 'STATISTICHE VITA', total_sessions: 'Sessioni Totali', volume_kg: 'Volume (kg)', settings: 'Impostazioni', appearance: 'ASPETTO', dark_mode: 'Modalità Scura', notifications: 'Notifiche', privacy: 'Modalità Privata', language: 'Lingua', units: 'Unità', data_privacy: 'DATI', export_data: 'Esporta Dati', clear_cache: 'Svuota Cache', account: 'ACCOUNT', change_avatar: 'Cambia Avatar', edit_name: 'Modifica Nome', reset_password: 'Reimposta Password', logout: 'Esci', placeholder_name: 'Il tuo nome', toast_avatar_success: 'Avatar aggiornato!', toast_logout_fail: 'Errore logout.', alert_logout_title: 'Esci', alert_logout_msg: 'Vuoi uscire davvero?', toast_pass_req: 'Email non trovata.', toast_pass_sent: 'Email inviata!', edit_profile_title: 'Modifica Profilo', name_label: 'Nome', weight_label: 'Peso (kg)', height_label: 'Altezza (cm)', units_title: 'Unità di Peso', unit_metric: 'Metrico (kg/cm)', unit_imperial: 'Imperiale (lbs/in)', export_title: 'Esporta', export_confirm: 'Scaricare JSON?', export_success: 'Esportato!', export_empty: 'Nessun dato.', notif_reminder: 'Ora di allenarsi! 💪', notif_body: 'I tuoi muscoli aspettano!', alert_cancel: 'Annulla', confirm: 'Conferma', leaderboard: 'Classifica', global: 'Globale', friends: 'Amici', rank: 'RANGO', athlete: 'ATLETA', day_streak: 'giorni di fila', kg_lifted: 'kg sollevati', no_friends: 'Nessun amico.', go_to_global: 'Aggiungi amici!', friend_added: 'aggiunto!', friend_removed: 'rimosso.', friend_action: 'Aggiornamento', trophy_cabinet: 'BACHECA TROFEI', trophy_consistency: 'Re della Costanza', trophy_consistency_desc: '10+ Allenamenti', trophy_elephant: 'L\'Elefante', trophy_elephant_desc: '10.000kg+', trophy_owl: 'Gufo Notturno', trophy_owl_desc: 'Primo Allenamento', history_desc: 'Vedi sessioni passate', toast_lang_changed: 'Lingua modificata in', share_to_socials: 'Condividi sui Social' },
  de: {
    cancel: "Abbrechen", save: "Speichern", edit: "Bearbeiten", ok: "OK", search: "Suche",
    good_morning: "Guten Morgen", good_afternoon: "Guten Tag", good_evening: "Guten Abend",
    quick_start: "Schnellstart", check_cns: "Körper-Check",
    active_streak: "Aktive Serie", days: "Tage", dashboard: "DASHBOARD", ready_to_break_limits: "Bereit für neue Limits?",
    your_overview: "Deine Übersicht", last_workout: "Letztes Training", this_week: "Diese Woche",
    history_title: "Trainingsverlauf", completed: "Abgeschlossen", volume: "Volumen", sets: "Sätze",
    no_history: "Kein Verlauf bisher. Leg los!",
    search_exercises: "Übungen suchen...", filter_location: "Ort", filter_level: "Level", filter_muscle: "Zielmuskel",
    filtered_results: "Gefilterte Ergebnisse", popular_exercises: "Beliebte Übungen", add_to_logger: "Hinzufügen", instructions: "Anleitung",
    active_session: "Aktive Session", add_exercise: "Übung hinzufügen", finish_workout: "Training beenden",
    set: "Satz", weight_kg: "kg", reps: "Wdh", rest: "Pause",
    system_error: "Systemfehler", biometrics: "Biometrie", save_all: "Alles speichern", edit_profile: "Profil bearbeiten",
    weight: "GEWICHT", height: "GRÖßE", bmi: "BMI", ai_coach: "KI COACH", recovery_status: "Erholungsstatus", injury_risk: "Verletzungsrisiko",
    lifetime_stats: "LEBENSZEIT-STATISTIK", total_sessions: "Gesamte Sessions", volume_kg: "Volumen (kg)",
    settings: "Einstellungen", appearance: "AUSSEHEN", dark_mode: "Dunkelmodus",
    notifications: "Benachrichtigungen", privacy: "Privatmodus", language: "Sprache", units: "Einheiten",
    data_privacy: "DATENSCHUTZ", export_data: "Daten exportieren", clear_cache: "Cache leeren",
    account: "ACCOUNT", change_avatar: "Avatar ändern", edit_name: "Name bearbeiten", reset_password: "Passwort zurücksetzen", logout: "Abmelden",
    placeholder_name: "Dein Name", toast_avatar_success: "Avatar aktualisiert!", toast_logout_fail: "Abmeldung fehlgeschlagen.",
    alert_logout_title: "Abmelden", alert_logout_msg: "Wirklich abmelden?",
    toast_pass_req: "E-Mail nicht gefunden.", toast_pass_sent: "Reset E-Mail gesendet!",
    edit_profile_title: "Profil bearbeiten", name_label: "Name", weight_label: "Gewicht (kg)", height_label: "Größe (cm)",
    units_title: "Gewichtseinheit", unit_metric: "Metrisch (kg)", unit_imperial: "Imperial (lbs)",
    export_title: "Exportieren", export_confirm: "Als JSON herunterladen?", export_success: "Exportiert!", export_empty: "Keine Daten.",
    notif_reminder: "Zeit fürs Training! 💪", notif_body: "Die Muskeln warten!",
    alert_cancel: "Abbrechen", confirm: "Bestätigen",
    leaderboard: "Rangliste", global: "Global", friends: "Freunde", rank: "RANG", athlete: "ATHLET", 
    day_streak: "Tage in Folge", kg_lifted: "kg gehoben", no_friends: "Keine Freunde.", go_to_global: "Gehe zu Global!",
    friend_added: "hinzugefügt!", friend_removed: "entfernt.", friend_action: "Update",
    trophy_cabinet: "TROPHÄEN", trophy_consistency: "Konstanz-König", trophy_consistency_desc: "10+ Workouts",
    trophy_elephant: "Der Elefant", trophy_elephant_desc: "10.000kg+", trophy_owl: "Nachteule", trophy_owl_desc: "Erstes Workout",
    history_desc: "Vergangene Sessions", injury_optimal_fallback: "Safe to increase weight.", deload_optimal_fallback: "Body condition is optimal.", toast_local_cache_cleared: "Local cache cleared. App will run faster now.", toast_workout_logs_are_now: "Workout logs are now private.", toast_dark_mode_activated: "Dark mode activated.", toast_notifications_off: "Notifications OFF", toast_notifications_on__ch: "Notifications ON (Check system permissions)", toast_notifications_on: "Notifications ON", toast_permission_to_access: "Permission to access camera roll is required!", toast_profile_updated_succ: "Profile updated successfully!", toast_please_fill_all_fiel: "Please fill all fields correctly.", toast_lang_changed: "Sprache geändert zu", share_to_socials: "Teilen"
  },
  zh: {
    cancel: "取消", save: "保存", edit: "编辑", ok: "确定", search: "搜索",
    good_morning: "早上好", good_afternoon: "下午好", good_evening: "晚上好",
    quick_start: "快速开始", check_cns: "体能检查",
    active_streak: "连续活跃", days: "天", dashboard: "仪表板", ready_to_break_limits: "准备好突破极限了吗？",
    your_overview: "你的概览", last_workout: "上次训练", this_week: "本周",
    history_title: "训练记录", completed: "已完成", volume: "总容量", sets: "组数",
    no_history: "暂无记录，开始训练吧！",
    search_exercises: "搜索动作...", filter_location: "地点", filter_level: "难度", filter_muscle: "目标肌肉",
    filtered_results: "筛选结果", popular_exercises: "热门动作", add_to_logger: "添加", instructions: "说明",
    active_session: "训练中", add_exercise: "添加动作", finish_workout: "结束训练",
    set: "组", weight_kg: "kg", reps: "次", rest: "休息",
    system_error: "系统错误", biometrics: "生物数据", save_all: "全部保存", edit_profile: "编辑个人资料",
    weight: "体重", height: "身高", bmi: "BMI", ai_coach: "AI 教练", recovery_status: "恢复状态", injury_risk: "受伤风险",
    lifetime_stats: "总数据", total_sessions: "总次数", volume_kg: "总容量(kg)",
    settings: "设置", appearance: "外观", dark_mode: "深色模式",
    notifications: "通知", privacy: "隐私模式", language: "语言", units: "单位",
    data_privacy: "数据与隐私", export_data: "导出数据", clear_cache: "清除缓存",
    account: "账号", change_avatar: "更换头像", edit_name: "修改名称", reset_password: "重置密码", logout: "登出",
    placeholder_name: "你的名字", toast_avatar_success: "头像已更新！", toast_logout_fail: "登出失败。",
    alert_logout_title: "登出", alert_logout_msg: "确定要登出吗？",
    toast_pass_req: "未找到邮箱。", toast_pass_sent: "重置邮件已发送！",
    edit_profile_title: "编辑个人资料", name_label: "名称", weight_label: "体重 (kg)", height_label: "身高 (cm)",
    units_title: "重量单位", unit_metric: "公制 (kg)", unit_imperial: "英制 (lbs)",
    export_title: "导出数据", export_confirm: "下载为 JSON？", export_success: "导出成功！", export_empty: "无数据。",
    notif_reminder: "该训练了！💪", notif_body: "肌肉在召唤你！",
    alert_cancel: "取消", confirm: "确定",
    leaderboard: "排行榜", global: "全球", friends: "好友", rank: "排名", athlete: "运动员", 
    day_streak: "天连续", kg_lifted: "kg 已举起", no_friends: "暂无好友。", go_to_global: "去全球榜加好友！",
    friend_added: "已添加好友！", friend_removed: "已删除好友。", friend_action: "好友更新",
    trophy_cabinet: "奖杯陈列柜", trophy_consistency: "坚持之王", trophy_consistency_desc: "10+ 次训练",
    trophy_elephant: "大象", trophy_elephant_desc: "举起 10,000kg+", trophy_owl: "夜猫子", trophy_owl_desc: "第一次训练",
    history_desc: "查看所有历史训练", injury_optimal_fallback: "Safe to increase weight.", deload_optimal_fallback: "Body condition is optimal.", toast_local_cache_cleared: "Local cache cleared. App will run faster now.", toast_workout_logs_are_now: "Workout logs are now private.", toast_dark_mode_activated: "Dark mode activated.", toast_notifications_off: "Notifications OFF", toast_notifications_on__ch: "Notifications ON (Check system permissions)", toast_notifications_on: "Notifications ON", toast_permission_to_access: "Permission to access camera roll is required!", toast_profile_updated_succ: "Profile updated successfully!", toast_please_fill_all_fiel: "Please fill all fields correctly.", toast_lang_changed: "语言已更改为", share_to_socials: "分享"
  },
  ko: {
    cancel: "취소", save: "저장", edit: "편집", ok: "확인", search: "검색",
    good_morning: "좋은 아침", good_afternoon: "좋은 오후", good_evening: "좋은 저녁",
    quick_start: "빠른 시작", check_cns: "컨디션 체크",
    active_streak: "연속 기록", days: "일", dashboard: "대시보드", ready_to_break_limits: "한계를 넘어설 준비가 되셨나요?",
    your_overview: "요약", last_workout: "최근 운동", this_week: "이번 주",
    history_title: "운동 기록", completed: "완료", volume: "볼륨", sets: "세트",
    no_history: "기록이 없습니다. 운동을 시작하세요!",
    search_exercises: "운동 검색...", filter_location: "장소", filter_level: "난이도", filter_muscle: "타겟 근육",
    filtered_results: "필터된 결과", popular_exercises: "인기 운동", add_to_logger: "추가", instructions: "설명",
    active_session: "진행 중", add_exercise: "운동 추가", finish_workout: "운동 종료",
    set: "세트", weight_kg: "kg", reps: "회", rest: "휴식",
    system_error: "시스템 오류", biometrics: "생체 데이터", save_all: "모두 저장", edit_profile: "프로필 편집",
    weight: "체중", height: "신장", bmi: "BMI", ai_coach: "AI 코치", recovery_status: "회복 상태", injury_risk: "부상 위험",
    lifetime_stats: "누적 기록", total_sessions: "총 운동 수", volume_kg: "총 볼륨(kg)",
    settings: "설정", appearance: "모양", dark_mode: "다크 모드",
    notifications: "알림", privacy: "비공개 모드", language: "언어", units: "단위",
    data_privacy: "데이터 및 개인정보", export_data: "데이터 내보내기", clear_cache: "캐시 삭제",
    account: "계정", change_avatar: "아바타 변경", edit_name: "이름 변경", reset_password: "비밀번호 초기화", logout: "로그아웃",
    placeholder_name: "이름", toast_avatar_success: "아바타가 업데이트되었습니다!", toast_logout_fail: "로그아웃 실패.",
    alert_logout_title: "로그아웃", alert_logout_msg: "로그아웃 하시겠습니까?",
    toast_pass_req: "이메일을 찾을 수 없습니다.", toast_pass_sent: "비밀번호 초기화 이메일이 전송되었습니다!",
    edit_profile_title: "프로필 편집", name_label: "표시 이름", weight_label: "체중 (kg)", height_label: "신장 (cm)",
    units_title: "무게 단위", unit_metric: "미터법 (kg)", unit_imperial: "야드파운드법 (lbs)",
    export_title: "데이터 내보내기", export_confirm: "JSON으로 다운로드하시겠습니까?", export_success: "내보내기 완료!", export_empty: "데이터가 없습니다.",
    notif_reminder: "운동할 시간입니다! 💪", notif_body: "근육이 기다리고 있습니다!",
    alert_cancel: "취소", confirm: "확인",
    leaderboard: "리더보드", global: "글로벌", friends: "친구", rank: "순위", athlete: "선수", 
    day_streak: "일 연속", kg_lifted: "kg 들어올림", no_friends: "친구가 없습니다.", go_to_global: "글로벌에서 친구를 추가하세요!",
    friend_added: "친구로 추가되었습니다!", friend_removed: "친구에서 삭제되었습니다.", friend_action: "친구 업데이트",
    trophy_cabinet: "트로피 보관함", trophy_consistency: "꾸준함의 왕", trophy_consistency_desc: "운동 10회 이상",
    trophy_elephant: "코끼리", trophy_elephant_desc: "10,000kg+ 들기", trophy_owl: "올빼미", trophy_owl_desc: "첫 번째 운동",
    history_desc: "모든 과거 세션 보기", injury_optimal_fallback: "Safe to increase weight.", deload_optimal_fallback: "Body condition is optimal.", toast_local_cache_cleared: "Local cache cleared. App will run faster now.", toast_workout_logs_are_now: "Workout logs are now private.", toast_dark_mode_activated: "Dark mode activated.", toast_notifications_off: "Notifications OFF", toast_notifications_on__ch: "Notifications ON (Check system permissions)", toast_notifications_on: "Notifications ON", toast_permission_to_access: "Permission to access camera roll is required!", toast_profile_updated_succ: "Profile updated successfully!", toast_please_fill_all_fiel: "Please fill all fields correctly.", toast_lang_changed: "언어가 변경되었습니다:", share_to_socials: "공유하기"
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    const loadLang = async () => {
      try {
        const saved = await AsyncStorage.getItem('gymvault_lang');
        if (saved && TRANSLATIONS[saved]) {
          setLanguageState(saved);
        }
      } catch (e) {
        console.log('Failed to load language', e);
      }
    };
    loadLang();
  }, []);

  const setLanguage = async (langCode) => {
    if (TRANSLATIONS[langCode]) {
      setLanguageState(langCode);
      try {
        await AsyncStorage.setItem('gymvault_lang', langCode);
      } catch (e) {
        console.log('Failed to save language', e);
      }
    }
  };

  const t = (key) => {
    return TRANSLATIONS[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
