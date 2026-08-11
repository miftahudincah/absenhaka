// ============================================================
// IP WHITELIST - HANYA IP TERTENTU YANG BOLEH AKSES
// ============================================================
const ALLOWED_IPS = [
    '36.79.207.155',
];

async function checkIpWhitelist() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const userIp = data.ip;
        
        console.log('🌐 IP Pengguna:', userIp);
        console.log('📋 IP yang diizinkan:', ALLOWED_IPS);
        
        const isAllowed = ALLOWED_IPS.some(allowedIp => {
            return allowedIp.toLowerCase() === userIp.toLowerCase();
        });
        
        if (!isAllowed) {
            document.body.innerHTML = `
                <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    background: #0a0c0f;
                    color: #eaeef2;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    text-align: center;
                    padding: 20px;
                ">
                    <div style="
                        background: #1a1a2e;
                        padding: 40px 50px;
                        border-radius: 20px;
                        border: 2px solid #e74c3c;
                        max-width: 500px;
                        box-shadow: 0 0 60px rgba(231, 76, 60, 0.2);
                    ">
                        <div style="font-size: 64px; margin-bottom: 20px;">🚫</div>
                        <h1 style="color: #e74c3c; margin: 0 0 10px 0;">Akses Ditolak</h1>
                        <p style="color: #8a9aaa; font-size: 16px; margin: 10px 0;">
                            Hanya perangkat yang terdaftar yang dapat mengakses halaman ini.
                        </p>
                        <div style="
                            background: #0a0c0f;
                            padding: 10px 15px;
                            border-radius: 8px;
                            margin: 20px 0;
                            font-size: 13px;
                            color: #6a7e94;
                            word-break: break-all;
                        ">
                            <strong>IP Anda:</strong> ${userIp}
                            <br>
                            <span style="color: #e74c3c;">❌ Tidak terdaftar</span>
                        </div>
                        <p style="color: #4a5a6a; font-size: 12px;">
                            Hubungi administrator untuk pendaftaran perangkat.
                        </p>
                    </div>
                </div>
            `;
            document.body.style.margin = '0';
            return false;
        }
        
        console.log('✅ IP terdaftar! Akses diizinkan.');
        return true;
        
    } catch (error) {
        console.error('❌ Gagal memeriksa IP:', error);
        return true;
    }
}

// ============================================================
// FIREBASE CONFIG - REALTIME DATABASE
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyBbem4w69k0tUoOI5NBFoX76TiDPhw9lH4",
    authDomain: "trainer123-y.firebaseapp.com",
    databaseURL: "https://trainer123-y-default-rtdb.firebaseio.com",
    projectId: "trainer123-y",
    storageBucket: "trainer123-y.firebasestorage.app",
    messagingSenderId: "766102925023",
    appId: "1:766102925023:web:f180d54c586c8c6382036a"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
console.log('🔥 Firebase Realtime Database initialized');

// ============================================================
// ACCESS CODE
// ============================================================
const ACCESS_CODE = "zaki5go";

// ============================================================
// JAM KERJA - DEFAULT
// ============================================================
let JAM_MASUK_BATAS = 10;
let JAM_PULANG_MULAI = 15;

// ============================================================
// GPS - LOKASI ABSEN (DEFAULT: SIDOARJO)
// ============================================================
const GPS_RADIUS = 100;
const DEFAULT_LAT = -7.272305;
const DEFAULT_LNG = 112.666827;
let GPS_LOCATION = { lat: DEFAULT_LAT, lng: DEFAULT_LNG };

// ============================================================
// FACE MATCHING THRESHOLD
// ============================================================
const FACE_MATCH_THRESHOLD = 0.5;

// ============================================================
// CLOCK
// ============================================================
function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour12: false });
    const dateStr = now.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayName = dayNames[now.getDay()];

    document.getElementById('clockTime').textContent = timeStr;
    document.getElementById('clockDate').textContent = dateStr;
    document.getElementById('clockDay').textContent = dayName;
}

updateClock();
setInterval(updateClock, 1000);

// ============================================================
// STATE
// ============================================================
const STATE = {
    registered: [],
    attendance: {},
    attendanceHistory: [],
    isDetecting: false,
    modelLoaded: false,
    stream: null,
    previewStream: null,
    detectedFaces: [],
    faceCount: 0,
    isRegistering: false,
    isSyncing: false,
    lastSync: null,
    isInitialized: false,
    firebaseReady: false,
    autoAbsenCooldown: {},
    updateCount: 0,
    lastUpdateTime: null,
    modelsLoaded: {
        tinyFaceDetector: false,
        faceLandmark68: false,
        faceRecognition: false
    },
    isModalOpen: false,
    isJamModalOpen: false,
    isExportModalOpen: false,
    isGpsModalOpen: false,
    isIzinPulangModalOpen: false,
    modelLoadingPromise: null,
    today: new Date().toISOString().split('T')[0],
    mapInstance: null,
    mapMarker: null,
    mapCircle: null,
    processedFaces: new Set()
};

// ============================================================
// DOM REFS
// ============================================================
const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');
const placeholderCam = document.getElementById('placeholderCam');
const faceListEl = document.getElementById('faceList');
const totalCount = document.getElementById('totalCount');

const registerModal = document.getElementById('registerModal');
const showRegisterBtn = document.getElementById('showRegisterBtn');
const closeModalBtn = document.getElementById('closeRegisterModal');
const cancelRegisterBtn = document.getElementById('cancelRegisterBtn');
const registerName = document.getElementById('registerName');
const accessCode = document.getElementById('accessCode');
const registerBtn = document.getElementById('registerBtn');
const registerStatus = document.getElementById('registerStatus');
const previewVideo = document.getElementById('previewVideo');
const previewOverlay = document.getElementById('previewOverlay');
const previewCtx = previewOverlay.getContext('2d');
const previewPlaceholder = document.getElementById('previewPlaceholder');
const previewInfo = document.getElementById('previewInfo');

const jamModal = document.getElementById('jamModal');
const jamInfoBadge = document.getElementById('jamInfoBadge');
const closeJamBtn = document.getElementById('closeJamModal');
const cancelJamBtn = document.getElementById('cancelJamBtn');
const saveJamBtn = document.getElementById('saveJamBtn');
const jamAccessCode = document.getElementById('jamAccessCode');
const jamMasukInput = document.getElementById('jamMasukInput');
const jamPulangInput = document.getElementById('jamPulangInput');
const jamStatus = document.getElementById('jamStatus');
const jamMasukDisplay = document.getElementById('jamMasukDisplay');
const jamPulangDisplay = document.getElementById('jamPulangDisplay');

const gpsModal = document.getElementById('gpsModal');
const gpsBadge = document.getElementById('gpsBadge');
const gpsStatus = document.getElementById('gpsStatus');
const closeGpsBtn = document.getElementById('closeGpsModal');
const cancelGpsBtn = document.getElementById('cancelGpsBtn');
const saveGpsBtn = document.getElementById('saveGpsBtn');
const gpsAccessCode = document.getElementById('gpsAccessCode');
const gpsSearchInput = document.getElementById('gpsSearchInput');
const gpsMap = document.getElementById('gpsMap');
const gpsLatDisplay = document.getElementById('gpsLatDisplay');
const gpsLngDisplay = document.getElementById('gpsLngDisplay');
const gpsStatusMsg = document.getElementById('gpsStatusMsg');

const exportModal = document.getElementById('exportModal');
const exportExcelBtn = document.getElementById('exportExcelBtn');
const closeExportBtn = document.getElementById('closeExportModal');
const cancelExportBtn = document.getElementById('cancelExportBtn');
const doExportBtn = document.getElementById('doExportBtn');
const exportWeek = document.getElementById('exportWeek');
const exportYear = document.getElementById('exportYear');
const exportStatus = document.getElementById('exportStatus');

// Izin Pulang Modal DOM
const izinPulangModal = document.getElementById('izinPulangModal');
const closeIzinPulangModal = document.getElementById('closeIzinPulangModal');
const cancelIzinBtn = document.getElementById('cancelIzinBtn');
const submitIzinBtn = document.getElementById('submitIzinBtn');
const izinAccessCode = document.getElementById('izinAccessCode');
const izinNamaInput = document.getElementById('izinNamaInput');
const izinStatus = document.getElementById('izinStatus');

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const syncBtn = document.getElementById('syncBtn');
const syncAllBtn = document.getElementById('syncAllBtn');
const izinPulangBtn = document.getElementById('izinPulangBtn');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const detectionInfo = document.getElementById('detectionInfo');
const modelStatus = document.getElementById('modelStatus');
const firebaseStatus = document.getElementById('firebaseStatus');
const lastSyncStatus = document.getElementById('lastSyncStatus');
const autoStatus = document.getElementById('autoStatus');
const historyList = document.getElementById('historyList');
const absenCount = document.getElementById('absenCount');
const updateCount = document.getElementById('updateCount');
const statusRegistered = document.getElementById('statusRegistered');
const statusDetected = document.getElementById('statusDetected');
const statusAbsen = document.getElementById('statusAbsen');
const statusUpdate = document.getElementById('statusUpdate');
const statusAuto = document.getElementById('statusAuto');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMessage');

// ============================================================
// TOAST
// ============================================================
let toastTimer = null;

function showToast(msg, type = 'info') {
    const iconMap = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle',
        auto: 'fa-magic',
        update: 'fa-sync-alt'
    };
    toast.className = `toast ${type}`;
    toast.querySelector('i').className = `fas ${iconMap[type] || iconMap.info}`;
    toastMsg.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================================
// UPDATE JAM DISPLAY
// ============================================================
function updateJamDisplay() {
    if (jamMasukDisplay) jamMasukDisplay.textContent = JAM_MASUK_BATAS;
    if (jamPulangDisplay) jamPulangDisplay.textContent = JAM_PULANG_MULAI;
    if (jamMasukInput) jamMasukInput.value = JAM_MASUK_BATAS;
    if (jamPulangInput) jamPulangInput.value = JAM_PULANG_MULAI;
    console.log(`📋 Jam kerja: Masuk ≤ ${JAM_MASUK_BATAS}:00 | Pulang ≥ ${JAM_PULANG_MULAI}:00`);
}

// ============================================================
// UPDATE GPS DISPLAY
// ============================================================
function updateGpsDisplay() {
    if (GPS_LOCATION) {
        gpsStatus.textContent = `📍 ${GPS_LOCATION.lat.toFixed(6)}, ${GPS_LOCATION.lng.toFixed(6)}`;
        gpsBadge.className = 'badge-gps active';
        if (gpsStatusMsg) {
            gpsStatusMsg.textContent = `✅ Lokasi aktif: ${GPS_LOCATION.lat.toFixed(6)}, ${GPS_LOCATION.lng.toFixed(6)} (Radius ${GPS_RADIUS}m)`;
            gpsStatusMsg.style.color = '#2ecc71';
        }
    } else {
        gpsStatus.textContent = 'Lokasi: Belum';
        gpsBadge.className = 'badge-gps inactive';
    }
    console.log(`📍 GPS: ${GPS_LOCATION ? GPS_LOCATION.lat + ', ' + GPS_LOCATION.lng : 'Belum diatur'}`);
}

// ============================================================
// STATUS UI
// ============================================================
function setStatus(active, msg, loading = false) {
    if (loading) {
        statusDot.className = 'dot loading';
        statusText.innerHTML = `<i class="fas fa-spinner fa-pulse"></i> ${msg || 'memuat...'}`;
        return;
    }
    statusDot.className = `dot ${active ? 'active' : 'inactive'}`;
    statusText.textContent = msg || (active ? 'deteksi aktif' : 'tidak aktif');
    if (active) {
        statusText.innerHTML = `<i class="fas fa-sync-alt fa-spin"></i> ${msg || 'deteksi aktif'}`;
    } else {
        statusText.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> ${msg || 'tidak aktif'}`;
    }
}

function updateModelStatus() {
    const loaded = STATE.modelsLoaded;
    const allLoaded = loaded.tinyFaceDetector && loaded.faceLandmark68 && loaded.faceRecognition;
    if (allLoaded) {
        modelStatus.innerHTML = '<i class="fas fa-check-circle"></i> Model: siap';
        modelStatus.className = 'info-badge success';
    } else {
        const parts = [];
        if (!loaded.tinyFaceDetector) parts.push('detector');
        if (!loaded.faceLandmark68) parts.push('landmark');
        if (!loaded.faceRecognition) parts.push('recognition');
        modelStatus.innerHTML = `<i class="fas fa-spinner fa-pulse"></i> Model: memuat ${parts.join(', ')}...`;
        modelStatus.className = 'info-badge warning';
    }
    return allLoaded;
}

function updateFirebaseStatus(connected, msg = '') {
    STATE.firebaseReady = connected;
    if (connected) {
        firebaseStatus.innerHTML = '<i class="fas fa-check-circle"></i> Realtime DB: terhubung';
        firebaseStatus.className = 'info-badge success';
    } else {
        firebaseStatus.innerHTML = `<i class="fas fa-times-circle"></i> Realtime DB: ${msg || 'tidak terhubung'}`;
        firebaseStatus.className = 'info-badge error';
    }
}

function updateLastSync() {
    if (STATE.lastSync) {
        const time = new Date(STATE.lastSync).toLocaleTimeString('id-ID', { hour12: false });
        lastSyncStatus.innerHTML = `<i class="fas fa-check-circle"></i> Sinkron: ${time}`;
        lastSyncStatus.className = 'info-badge success';
    } else {
        lastSyncStatus.innerHTML = '<i class="fas fa-clock"></i> Sinkron: -';
        lastSyncStatus.className = 'info-badge';
    }
}

function updateStatusBar() {
    statusRegistered.textContent = STATE.registered.length;
    statusDetected.textContent = STATE.detectedFaces.length;

    const hadirCount = STATE.attendanceHistory.filter(h => h.status === 'hadir').length;
    statusAbsen.textContent = hadirCount;
    statusAbsen.className = `value ${hadirCount > 0 ? 'hadir' : 'tidak'}`;

    if (STATE.lastUpdateTime) {
        const time = new Date(STATE.lastUpdateTime).toLocaleTimeString('id-ID', { hour12: false });
        statusUpdate.textContent = time;
        statusUpdate.className = 'value update';
    } else {
        statusUpdate.textContent = '-';
        statusUpdate.className = 'value';
    }

    updateCount.textContent = STATE.updateCount;

    if (STATE.isDetecting) {
        statusAuto.textContent = '🔍 Mendeteksi...';
        statusAuto.style.color = '#5f9ef0';
    } else if (STATE.registered.length === 0) {
        statusAuto.textContent = '⚠️ Belum ada wajah terdaftar';
        statusAuto.style.color = '#f39c12';
    } else {
        statusAuto.textContent = '✅ Auto absen aktif';
        statusAuto.style.color = '#2ecc71';
    }
}

function updateAbsenCount() {
    const today = new Date().toISOString().split('T')[0];
    const count = STATE.attendanceHistory.filter(h => h.date === today && h.status === 'hadir').length;
    absenCount.textContent = count;
}

// ============================================================
// CEK JAM UNTUK ABSENSI
// ============================================================
function cekJamAbsen() {
    const now = new Date();
    const jam = now.getHours();
    const menit = now.getMinutes();
    const waktu = jam + menit / 60;
    
    const bisaMasuk = waktu < JAM_MASUK_BATAS;
    const bisaPulang = waktu >= JAM_PULANG_MULAI;
    
    return { bisaMasuk, bisaPulang, jam, menit, waktu };
}

// ============================================================
// CEK LOKASI GPS
// ============================================================
function cekLokasi() {
    return new Promise((resolve) => {
        if (!GPS_LOCATION) {
            resolve({ valid: false, error: 'Lokasi absen belum diatur' });
            return;
        }

        if (!navigator.geolocation) {
            resolve({ valid: false, error: 'Browser tidak mendukung GPS' });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                
                const distance = getDistance(
                    userLat, userLng,
                    GPS_LOCATION.lat, GPS_LOCATION.lng
                );
                
                if (distance <= GPS_RADIUS) {
                    resolve({ 
                        valid: true, 
                        distance: distance,
                        lat: userLat,
                        lng: userLng
                    });
                } else {
                    resolve({ 
                        valid: false, 
                        error: `Anda berada ${distance.toFixed(1)}m dari titik absen (maks ${GPS_RADIUS}m)`,
                        distance: distance
                    });
                }
            },
            (error) => {
                let msg = 'Gagal mendapatkan lokasi: ';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        msg += 'Izin lokasi ditolak';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        msg += 'Lokasi tidak tersedia';
                        break;
                    case error.TIMEOUT:
                        msg += 'Waktu habis';
                        break;
                    default:
                        msg += error.message;
                }
                resolve({ valid: false, error: msg });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    });
}

// ============================================================
// HITUNG JARAK (Haversine Formula)
// ============================================================
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// ============================================================
// FIREBASE REALTIME DATABASE FUNCTIONS
// ============================================================

async function loadFacesFromFirebase() {
    try {
        faceListEl.innerHTML = `<div class="empty-list"><span class="spinner"></span> Memuat data dari Firebase...</div>`;

        const snapshot = await db.ref('faces').once('value');
        const data = snapshot.val();
        const faces = [];

        if (data) {
            Object.keys(data).forEach(key => {
                const face = data[key];
                if (face.name && face.descriptor && face.descriptor.length > 0) {
                    faces.push({
                        id: key,
                        name: face.name,
                        descriptor: face.descriptor
                    });
                }
            });
        }

        STATE.registered = faces;
        STATE.attendance = {};
        faces.forEach(f => { STATE.attendance[f.id] = false; });

        renderList();
        updateFirebaseStatus(true);
        updateStatusBar();

        if (faces.length > 0) {
            showToast(`📂 ${faces.length} wajah dimuat dari Realtime DB`, 'success');
        }
        return faces;
    } catch (error) {
        console.error('❌ Gagal load wajah:', error);
        faceListEl.innerHTML = `<div class="empty-list">❌ ${error.message}</div>`;
        showToast('❌ Gagal load wajah: ' + error.message, 'error');
        updateFirebaseStatus(false, error.message);
        return [];
    }
}

async function loadHistoryFromFirebase() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const snapshot = await db.ref('attendance/' + today + '/individuals').once('value');
        const data = snapshot.val();
        const history = [];

        if (data) {
            Object.keys(data).forEach(key => {
                const item = data[key];
                if (item.name && item.status) {
                    history.push({
                        id: key,
                        name: item.name,
                        status: item.status,
                        time: item.time || '--:--',
                        date: item.date || today,
                        timestamp: item.timestamp || 0,
                        type: item.type || 'check_in',
                        jamAbsen: item.jamAbsen || '--:--',
                        location: item.location || null,
                        note: item.note || null
                    });
                }
            });
        }

        history.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        STATE.attendanceHistory = history;
        renderHistory();
        updateAbsenCount();
        updateStatusBar();
        return history;
    } catch (error) {
        console.error('❌ Gagal load history:', error);
        return [];
    }
}

// ============================================================
// FUNGSI LOAD SETTINGS DARI FIREBASE
// ============================================================
async function loadSettingsFromFirebase() {
    try {
        console.log('⏳ Memuat settings dari Firebase...');
        
        const settingsSnapshot = await db.ref('settings').once('value');
        const settingsData = settingsSnapshot.val();
        console.log('📋 Data settings dari Firebase:', settingsData);
        
        if (!settingsData) {
            console.log('⚠️ Tidak ada data settings di Firebase, membuat default...');
            
            await db.ref('settings/jam_kerja').set({
                jam_masuk_batas: JAM_MASUK_BATAS,
                jam_pulang_mulai: JAM_PULANG_MULAI,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
            
            await db.ref('settings/gps').set({
                lat: DEFAULT_LAT,
                lng: DEFAULT_LNG,
                radius: GPS_RADIUS,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
            
            console.log('✅ Data settings default berhasil dibuat di Firebase');
            showToast('✅ Pengaturan default tersimpan di Firebase', 'success');
            
            updateJamDisplay();
            updateGpsDisplay();
            return true;
        }
        
        if (settingsData.jam_kerja) {
            if (settingsData.jam_kerja.jam_masuk_batas !== undefined) {
                JAM_MASUK_BATAS = settingsData.jam_kerja.jam_masuk_batas;
            }
            if (settingsData.jam_kerja.jam_pulang_mulai !== undefined) {
                JAM_PULANG_MULAI = settingsData.jam_kerja.jam_pulang_mulai;
            }
            updateJamDisplay();
            console.log('✅ Jam kerja dimuat dari Firebase:', JAM_MASUK_BATAS, JAM_PULANG_MULAI);
        }
        
        if (settingsData.gps && settingsData.gps.lat && settingsData.gps.lng) {
            GPS_LOCATION = { lat: settingsData.gps.lat, lng: settingsData.gps.lng };
            updateGpsDisplay();
            console.log('✅ GPS dimuat dari Firebase:', GPS_LOCATION);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Gagal load settings:', error);
        showToast('❌ Gagal load settings: ' + error.message, 'error');
        return false;
    }
}

// ============================================================
// FUNGSI SAVE SETTINGS KE FIREBASE
// ============================================================
async function saveSettingsToFirebase() {
    try {
        await db.ref('settings/jam_kerja').set({
            jam_masuk_batas: JAM_MASUK_BATAS,
            jam_pulang_mulai: JAM_PULANG_MULAI,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        });
        console.log('✅ Jam kerja tersimpan di Firebase');

        if (GPS_LOCATION) {
            await db.ref('settings/gps').set({
                lat: GPS_LOCATION.lat,
                lng: GPS_LOCATION.lng,
                radius: GPS_RADIUS,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
            console.log('✅ GPS tersimpan di Firebase');
        }

        showToast('✅ Semua pengaturan tersimpan ke Firebase', 'success');
        return true;
    } catch (error) {
        console.error('❌ Gagal simpan settings:', error);
        showToast('❌ Gagal simpan settings: ' + error.message, 'error');
        return false;
    }
}

async function saveGpsToFirebase(lat, lng) {
    try {
        await db.ref('settings/gps').set({
            lat: lat,
            lng: lng,
            radius: GPS_RADIUS,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        });
        console.log('✅ GPS tersimpan di Firebase');
        return true;
    } catch (error) {
        console.error('❌ Gagal simpan GPS:', error);
        return false;
    }
}

async function saveFaceToFirebase(face) {
    try {
        await db.ref('faces/' + face.id).set({
            id: face.id,
            name: face.name,
            descriptor: face.descriptor,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        });
        console.log(`✅ Wajah ${face.name} tersimpan di Realtime DB`);
        return true;
    } catch (error) {
        console.error('❌ Gagal simpan wajah:', error);
        showToast('❌ Gagal simpan wajah: ' + error.message, 'error');
        return false;
    }
}

async function deleteFaceFromFirebase(id) {
    try {
        await db.ref('faces/' + id).remove();
        console.log(`🗑️ Wajah ${id} dihapus dari Realtime DB`);
        return true;
    } catch (error) {
        console.error('❌ Gagal hapus wajah:', error);
        return false;
    }
}

async function syncFacesToFirebase() {
    if (STATE.isSyncing) return;

    STATE.isSyncing = true;
    syncBtn.disabled = true;
    syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sinkron...';
    statusDot.className = 'dot sync';

    try {
        const updates = {};
        for (const face of STATE.registered) {
            updates[face.id] = {
                id: face.id,
                name: face.name,
                descriptor: face.descriptor,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            };
        }
        await db.ref('faces').update(updates);

        STATE.lastSync = Date.now();
        updateLastSync();
        console.log('✅ Data wajah tersinkron ke Realtime DB');
        showToast('✅ Data wajah tersinkron ke Realtime DB', 'success');
        updateFirebaseStatus(true);
    } catch (error) {
        console.error('❌ Gagal sinkron:', error);
        showToast('❌ Gagal sinkron: ' + error.message, 'error');
        updateFirebaseStatus(false, error.message);
    }

    STATE.isSyncing = false;
    syncBtn.disabled = false;
    syncBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Sinkron';
    statusDot.className = `dot ${STATE.isDetecting ? 'active' : 'inactive'}`;
}

// ============================================================
// FUNGSI SINKRON SEMUA DATA
// ============================================================
async function syncAllData() {
    try {
        console.log('🔄 Memulai sinkronisasi semua data...');
        
        if (STATE.registered.length > 0) {
            const updates = {};
            for (const face of STATE.registered) {
                updates[face.id] = {
                    id: face.id,
                    name: face.name,
                    descriptor: face.descriptor,
                    updatedAt: firebase.database.ServerValue.TIMESTAMP
                };
            }
            await db.ref('faces').update(updates);
            console.log('✅ Wajah tersinkron');
        }
        
        await db.ref('settings/jam_kerja').set({
            jam_masuk_batas: JAM_MASUK_BATAS,
            jam_pulang_mulai: JAM_PULANG_MULAI,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
        });
        console.log('✅ Jam kerja tersinkron');
        
        if (GPS_LOCATION) {
            await db.ref('settings/gps').set({
                lat: GPS_LOCATION.lat,
                lng: GPS_LOCATION.lng,
                radius: GPS_RADIUS,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
            console.log('✅ GPS tersinkron');
        }
        
        STATE.lastSync = Date.now();
        updateLastSync();
        
        await loadFacesFromFirebase();
        await loadHistoryFromFirebase();
        await loadSettingsFromFirebase();
        
        updateStatusBar();
        renderList();
        renderHistory();
        
        showToast('✅ Semua data berhasil disinkronkan ke Firebase!', 'success');
        console.log('✅ Sinkronisasi semua data selesai');
        
    } catch (error) {
        console.error('❌ Gagal sinkronisasi:', error);
        showToast('❌ Gagal sinkronisasi: ' + error.message, 'error');
    }
}

// ============================================================
// AUTO ATTENDANCE FUNCTIONS
// ============================================================
async function autoAbsen(name, id) {
    const now = Date.now();
    
    const cooldownKey = name;
    if (STATE.autoAbsenCooldown[cooldownKey] && (now - STATE.autoAbsenCooldown[cooldownKey] < 10000)) {
        console.log(`⏳ ${name} - Cooldown aktif, lewati`);
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour12: false });
    const { bisaMasuk, bisaPulang, jam, menit } = cekJamAbsen();
    
    const existingHistory = STATE.attendanceHistory.find(h =>
        h.name === name && h.date === today
    );

    try {
        const lokasi = await cekLokasi();
        if (!lokasi.valid) {
            showToast(`📍 ${name} - ${lokasi.error}`, 'warning');
            STATE.autoAbsenCooldown[cooldownKey] = Date.now();
            return;
        }

        if (existingHistory) {
            const isCheckIn = existingHistory.type === 'check_in' || existingHistory.type === 'auto_check_in';
            
            if (isCheckIn && !bisaPulang) {
                console.log(`ℹ️ ${name} - Sudah absen masuk, tunggu jam pulang`);
                STATE.autoAbsenCooldown[cooldownKey] = Date.now();
                return;
            }
            
            if (isCheckIn && bisaPulang) {
                const existingPulang = STATE.attendanceHistory.find(h =>
                    h.name === name && h.date === today && h.status === 'pulang'
                );
                
                if (existingPulang) {
                    console.log(`ℹ️ ${name} - Sudah absen pulang hari ini`);
                    STATE.autoAbsenCooldown[cooldownKey] = Date.now();
                    return;
                }
                
                const record = {
                    name: name,
                    status: 'pulang',
                    type: 'check_out',
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    date: today,
                    time: timeStr,
                    jamAbsen: `${String(jam).padStart(2, '0')}:${String(menit).padStart(2, '0')}`,
                    clientTime: new Date().toISOString(),
                    location: {
                        lat: lokasi.lat,
                        lng: lokasi.lng,
                        distance: lokasi.distance
                    }
                };

                await db.ref('attendance/' + today + '/individuals/' + existingHistory.id).remove();

                const ref = db.ref('attendance/' + today + '/individuals').push();
                await ref.set(record);

                const index = STATE.attendanceHistory.findIndex(h => h.id === existingHistory.id);
                if (index !== -1) {
                    STATE.attendanceHistory[index] = {
                        id: ref.key,
                        name: name,
                        status: 'pulang',
                        time: timeStr,
                        date: today,
                        timestamp: Date.now(),
                        type: 'check_out',
                        jamAbsen: record.jamAbsen,
                        location: record.location
                    };
                }

                STATE.updateCount++;
                STATE.lastUpdateTime = Date.now();
                STATE.autoAbsenCooldown[cooldownKey] = Date.now();

                renderHistory();
                updateStatusBar();

                showToast(`✅ ${name} - Absen Pulang ${timeStr} (${lokasi.distance.toFixed(1)}m)`, 'update');
                console.log(`✅ Absen Pulang: ${name} pada ${timeStr}`);
                return;
            }
            
            if (existingHistory.status === 'pulang') {
                console.log(`ℹ️ ${name} - Sudah pulang hari ini`);
                STATE.autoAbsenCooldown[cooldownKey] = Date.now();
                return;
            }
            
            STATE.autoAbsenCooldown[cooldownKey] = Date.now();
            return;
        }

        if (bisaMasuk) {
            const record = {
                name: name,
                status: 'hadir',
                type: 'check_in',
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                date: today,
                time: timeStr,
                jamAbsen: `${String(jam).padStart(2, '0')}:${String(menit).padStart(2, '0')}`,
                clientTime: new Date().toISOString(),
                location: {
                    lat: lokasi.lat,
                    lng: lokasi.lng,
                    distance: lokasi.distance
                }
            };

            const ref = db.ref('attendance/' + today + '/individuals').push();
            await ref.set(record);

            STATE.attendanceHistory.unshift({
                id: ref.key,
                name: name,
                status: 'hadir',
                time: timeStr,
                date: today,
                timestamp: Date.now(),
                type: 'check_in',
                jamAbsen: record.jamAbsen,
                location: record.location
            });

            STATE.attendance[id] = true;
            STATE.autoAbsenCooldown[cooldownKey] = Date.now();

            renderList();
            renderHistory();
            updateAbsenCount();
            updateStatusBar();

            showToast(`✅ ${name} - Absen Masuk ${timeStr} (${lokasi.distance.toFixed(1)}m)`, 'auto');
            console.log(`✅ Absen Masuk: ${name} pada ${timeStr}`);
            return;
        } 
        else if (jam >= JAM_MASUK_BATAS && jam < JAM_PULANG_MULAI) {
            showToast(`⏰ ${name} - Melewati batas absen masuk (${JAM_MASUK_BATAS}:00)`, 'warning');
            console.log(`⏰ ${name} - Melewati batas absen masuk`);
            STATE.autoAbsenCooldown[cooldownKey] = Date.now();
            return;
        }
        else if (bisaPulang) {
            const record = {
                name: name,
                status: 'pulang',
                type: 'check_out',
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                date: today,
                time: timeStr,
                jamAbsen: `${String(jam).padStart(2, '0')}:${String(menit).padStart(2, '0')}`,
                clientTime: new Date().toISOString(),
                location: {
                    lat: lokasi.lat,
                    lng: lokasi.lng,
                    distance: lokasi.distance
                }
            };

            const ref = db.ref('attendance/' + today + '/individuals').push();
            await ref.set(record);

            STATE.attendanceHistory.unshift({
                id: ref.key,
                name: name,
                status: 'pulang',
                time: timeStr,
                date: today,
                timestamp: Date.now(),
                type: 'check_out',
                jamAbsen: record.jamAbsen,
                location: record.location
            });

            STATE.attendance[id] = true;
            STATE.autoAbsenCooldown[cooldownKey] = Date.now();

            renderList();
            renderHistory();
            updateAbsenCount();
            updateStatusBar();

            showToast(`✅ ${name} - Absen Pulang ${timeStr} (${lokasi.distance.toFixed(1)}m)`, 'auto');
            console.log(`✅ Absen Pulang: ${name} pada ${timeStr}`);
            return;
        }

    } catch (error) {
        console.error('❌ Gagal auto absen:', error);
    }
}

// ============================================================
// RENDER FUNCTIONS - MENAMPILKAN SEMUA DATA
// ============================================================

function renderList() {
    const list = STATE.registered;
    
    // 🔥 TAMPILKAN SEMUA WAJAH (TERMASUK DUPLICATE)
    totalCount.textContent = list.length;

    if (list.length === 0) {
        faceListEl.innerHTML = `<div class="empty-list">Belum ada wajah terdaftar di Firebase</div>`;
        return;
    }

    let html = '';
    list.forEach((item) => {
        const hadir = STATE.attendance[item.id] === true;
        const statusClass = hadir ? 'hadir' : 'tidak-hadir';
        const statusLabel = hadir ? '✔ Hadir' : '✘ Tidak';
        const hasUpdate = STATE.attendanceHistory.some(h => h.name === item.name && h.type === 'update_time');
        const hasIzin = STATE.attendanceHistory.some(h => h.name === item.name && h.type === 'izin_pulang');
        
        let extraBadge = '';
        if (hadir && hasUpdate) extraBadge = 'updated';
        else if (hadir && hasIzin) extraBadge = 'izin';
        else if (hadir) extraBadge = 'auto';
        
        html += `
                    <div class="face-item" data-id="${item.id}">
                        <div class="name">
                            <i class="fas fa-user-circle"></i>
                            <span>${item.name}</span>
                            ${hadir ? `<span style="font-size:0.6rem;color:#b06af0;margin-left:0.3rem;"><i class="fas fa-magic"></i> ${extraBadge}</span>` : ''}
                            ${hasIzin ? `<span style="font-size:0.6rem;color:#f39c12;margin-left:0.2rem;">📝</span>` : ''}
                        </div>
                        <span class="status-badge ${statusClass}">${statusLabel} ${hasUpdate ? '🔄' : ''}</span>
                        <button class="btn-hapus" data-id="${item.id}" title="Hapus Wajah">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
    });
    faceListEl.innerHTML = html;

    faceListEl.querySelectorAll('.btn-hapus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.dataset.id;
            hapusWajahWithToken(id);
        });
    });
}

// ============================================================
// RENDER HISTORY - MENAMPILKAN SEMUA RIWAYAT
// ============================================================
function renderHistory() {
    const history = STATE.attendanceHistory;

    if (history.length === 0) {
        historyList.innerHTML = `<div style="color: #4a5a6a; text-align: center; font-size: 0.8rem; padding: 0.5rem;">Belum ada absensi</div>`;
        return;
    }

    let html = '';
    const today = new Date().toISOString().split('T')[0];
    const todayHistory = history.filter(h => h.date === today);

    if (todayHistory.length === 0) {
        historyList.innerHTML = `<div style="color: #4a5a6a; text-align: center; font-size: 0.8rem; padding: 0.5rem;">Belum ada absensi hari ini</div>`;
        return;
    }

    // 🔥 TAMPILKAN SEMUA RIWAYAT (TIDAK HANYA 1 PER NAMA)
    const sortedHistory = [...todayHistory].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    sortedHistory.slice(0, 50).forEach(item => {
        let statusClass = 'pulang';
        let statusLabel = '🚪 Pulang';
        let badge = ' <span class="h-update">pulang</span>';
        
        // 🔥 CEK STATUS IZIN PULANG
        if (item.status === 'izin_pulang' || item.type === 'izin_pulang') {
            statusClass = 'izin-pulang';
            statusLabel = '📝 Izin Pulang';
            badge = ' <span class="h-izin">izin</span>';
        } else if (item.status === 'hadir' || item.type === 'check_in' || item.type === 'auto_check_in') {
            statusClass = 'hadir';
            statusLabel = '✔ Masuk';
            badge = ' <span class="h-auto">masuk</span>';
        } else if (item.status === 'pulang' || item.type === 'check_out') {
            statusClass = 'pulang';
            statusLabel = '🚪 Pulang';
            badge = ' <span class="h-update">pulang</span>';
        } else if (item.type === 'update_time') {
            statusClass = 'pulang';
            statusLabel = '🚪 Pulang';
            badge = ' <span class="h-update">update</span>';
        }
        
        const jamTampil = item.jamAbsen || item.time || '--:--';
        const jarak = item.location && item.location.distance ? `📍${item.location.distance.toFixed(0)}m` : '';
        const note = item.note ? ` 📝${item.note}` : '';
        
        html += `
                    <div class="history-item" data-id="${item.id}">
                        <span class="h-name"><i class="fas fa-user"></i> ${item.name}</span>
                        <span class="h-status ${statusClass}">${statusLabel}${badge}</span>
                        <span class="h-time"><i class="fas fa-clock"></i> ${jamTampil} ${jarak}${note}</span>
                        <button class="btn-hapus-history" data-id="${item.id}" data-name="${item.name}" title="Hapus riwayat ini">
                            <i class="fas fa-trash-alt" style="font-size:0.6rem;color:#6a7e94;"></i>
                        </button>
                    </div>
                `;
    });

    historyList.innerHTML = html;

    historyList.querySelectorAll('.btn-hapus-history').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const name = btn.dataset.name;
            hapusHistoryItem(id, name);
        });
    });
}

// ============================================================
// CRUD - DENGAN TOKEN
// ============================================================

async function tambahWajah(name, descriptor) {
    if (!descriptor || !descriptor.length || descriptor.length === 0) {
        showToast('❌ Gagal: Descriptor tidak valid', 'error');
        return null;
    }

    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const newFace = {
        id,
        name,
        descriptor: Array.from(descriptor)
    };

    const saved = await saveFaceToFirebase(newFace);
    if (!saved) {
        showToast('❌ Gagal menyimpan ke Firebase', 'error');
        return null;
    }

    STATE.registered.push(newFace);
    STATE.attendance[id] = false;

    renderList();
    STATE.lastSync = Date.now();
    updateLastSync();
    updateStatusBar();

    showToast(`✅ "${name}" berhasil didaftarkan ke Firebase`, 'success');
    registerStatus.textContent = `✅ "${name}" terdaftar!`;

    return id;
}

async function hapusWajahWithToken(id) {
    const face = STATE.registered.find(f => f.id === id);
    if (!face) {
        showToast('❌ Data wajah tidak ditemukan', 'error');
        return;
    }

    const token = prompt(`⚠️ Konfirmasi Hapus "${face.name}"\n\nMasukkan Kode Akses untuk menghapus wajah ini:`);
    
    if (token === null) {
        showToast('❌ Penghapusan dibatalkan', 'info');
        return;
    }
    
    if (token !== ACCESS_CODE) {
        showToast('❌ Kode akses salah! Penghapusan dibatalkan.', 'error');
        return;
    }

    if (!confirm(`⚠️ Yakin ingin menghapus wajah "${face.name}" dari Firebase?`)) {
        showToast('❌ Penghapusan dibatalkan', 'info');
        return;
    }

    const deleted = await deleteFaceFromFirebase(id);
    if (!deleted) {
        showToast('❌ Gagal menghapus dari Firebase', 'error');
        return;
    }

    STATE.registered = STATE.registered.filter(item => item.id !== id);
    delete STATE.attendance[id];
    delete STATE.autoAbsenCooldown[id];
    delete STATE.autoAbsenCooldown[face.name];

    renderList();
    STATE.lastSync = Date.now();
    updateLastSync();
    updateStatusBar();

    showToast(`🗑️ Wajah "${face.name}" berhasil dihapus dari Firebase`, 'success');
    registerStatus.textContent = 'Siap mendaftar';
}

async function hapusHistoryItem(id, name) {
    if (!id) {
        showToast('❌ Data tidak valid', 'error');
        return;
    }

    const token = prompt(`⚠️ Konfirmasi Hapus Riwayat "${name}"\n\nMasukkan Kode Akses untuk menghapus riwayat absensi ini:`);
    
    if (token === null) {
        showToast('❌ Penghapusan dibatalkan', 'info');
        return;
    }
    
    if (token !== ACCESS_CODE) {
        showToast('❌ Kode akses salah! Penghapusan dibatalkan.', 'error');
        return;
    }

    if (!confirm(`⚠️ Yakin ingin menghapus riwayat absensi "${name}"?`)) {
        showToast('❌ Penghapusan dibatalkan', 'info');
        return;
    }

    try {
        const today = new Date().toISOString().split('T')[0];
        await db.ref('attendance/' + today + '/individuals/' + id).remove();
        
        STATE.attendanceHistory = STATE.attendanceHistory.filter(item => item.id !== id);
        
        const masihAda = STATE.attendanceHistory.some(h => h.name === name && h.date === today);
        if (!masihAda) {
            const reg = STATE.registered.find(r => r.name === name);
            if (reg) {
                STATE.attendance[reg.id] = false;
            }
        }
        
        renderHistory();
        updateAbsenCount();
        updateStatusBar();
        
        showToast(`🗑️ Riwayat "${name}" berhasil dihapus`, 'success');
        
    } catch (error) {
        console.error('❌ Gagal hapus riwayat:', error);
        showToast('❌ Gagal hapus riwayat: ' + error.message, 'error');
    }
}

async function resetSemua() {
    if (STATE.registered.length === 0) {
        showToast('Tidak ada data', 'info');
        return;
    }

    const token = prompt('⚠️ KONFIRMASI RESET SEMUA DATA\n\nMasukkan Kode Akses untuk menghapus SEMUA data dari Firebase:');
    
    if (token === null) {
        showToast('❌ Reset dibatalkan', 'info');
        return;
    }
    
    if (token !== ACCESS_CODE) {
        showToast('❌ Kode akses salah! Reset dibatalkan.', 'error');
        return;
    }

    if (!confirm('⚠️ Yakin ingin menghapus SEMUA data dari Firebase? Tindakan ini tidak bisa dibatalkan!')) {
        showToast('❌ Reset dibatalkan', 'info');
        return;
    }

    try {
        await db.ref('faces').remove();

        STATE.registered = [];
        STATE.attendance = {};
        STATE.detectedFaces = [];
        STATE.autoAbsenCooldown = {};
        STATE.updateCount = 0;
        STATE.lastUpdateTime = null;
        STATE.lastSync = Date.now();
        updateLastSync();

        renderList();
        updateStatusBar();
        registerStatus.textContent = 'Semua data direset dari Firebase';
        showToast('🔄 Semua data dihapus dari Firebase', 'info');
    } catch (error) {
        console.error('❌ Gagal reset data:', error);
        showToast('❌ Gagal reset: ' + error.message, 'error');
    }
}

// ============================================================
// PENGATURAN JAM KERJA
// ============================================================

function openJamModal() {
    if (STATE.isJamModalOpen) return;
    
    STATE.isJamModalOpen = true;
    jamModal.classList.add('show');
    jamAccessCode.value = '';
    jamMasukInput.value = JAM_MASUK_BATAS;
    jamPulangInput.value = JAM_PULANG_MULAI;
    jamStatus.textContent = 'Masukkan kode akses untuk mengubah';
    jamStatus.style.color = '#6a7e94';
}

function closeJamModal() {
    STATE.isJamModalOpen = false;
    jamModal.classList.remove('show');
}

async function saveJamSettings() {
    const code = jamAccessCode.value.trim();
    
    if (code !== ACCESS_CODE) {
        jamStatus.textContent = '❌ Kode akses salah!';
        jamStatus.style.color = '#e74c3c';
        showToast('❌ Kode akses salah!', 'error');
        return;
    }

    const masuk = parseInt(jamMasukInput.value);
    const pulang = parseInt(jamPulangInput.value);

    if (isNaN(masuk) || masuk < 0 || masuk > 23) {
        jamStatus.textContent = '❌ Jam masuk harus 0-23';
        jamStatus.style.color = '#e74c3c';
        showToast('❌ Jam masuk harus 0-23', 'error');
        return;
    }

    if (isNaN(pulang) || pulang < 0 || pulang > 23) {
        jamStatus.textContent = '❌ Jam pulang harus 0-23';
        jamStatus.style.color = '#e74c3c';
        showToast('❌ Jam pulang harus 0-23', 'error');
        return;
    }

    if (pulang <= masuk) {
        jamStatus.textContent = '❌ Jam pulang harus lebih besar dari jam masuk!';
        jamStatus.style.color = '#e74c3c';
        showToast('❌ Jam pulang harus lebih besar dari jam masuk!', 'error');
        return;
    }

    JAM_MASUK_BATAS = masuk;
    JAM_PULANG_MULAI = pulang;
    
    updateJamDisplay();
    
    await saveSettingsToFirebase();
    
    closeJamModal();
    
    showToast(`✅ Jam kerja diperbarui: Masuk ≤ ${JAM_MASUK_BATAS}:00 | Pulang ≥ ${JAM_PULANG_MULAI}:00`, 'success');
    console.log('✅ Pengaturan jam kerja berhasil diubah dan disimpan ke Firebase');
}

// ============================================================
// PENGATURAN GPS - LEAFLET
// ============================================================

let gpsMapInstance = null;
let gpsMarker = null;
let gpsCircle = null;
let gpsGeocoder = null;

function initGpsMap(lat = DEFAULT_LAT, lng = DEFAULT_LNG) {
    if (gpsMapInstance) {
        gpsMapInstance.setView([lat, lng], 17);
        updateGpsMarker(lat, lng);
        return;
    }

    gpsMapInstance = L.map('gpsMap', {
        center: [lat, lng],
        zoom: 17,
        zoomControl: true,
        fadeAnimation: true,
        attributionControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(gpsMapInstance);

    gpsGeocoder = L.Control.geocoder({
        defaultMarkGeocode: false,
        position: 'topleft',
        placeholder: 'Cari lokasi...',
        errorMessage: 'Lokasi tidak ditemukan'
    }).on('markgeocode', function(e) {
        const center = e.geocode.center;
        const lat = center.lat;
        const lng = center.lng;
        gpsMapInstance.setView([lat, lng], 17);
        updateGpsMarker(lat, lng);
        if (gpsSearchInput) {
            gpsSearchInput.value = e.geocode.name || '';
        }
    }).addTo(gpsMapInstance);

    gpsMapInstance.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        updateGpsMarker(lat, lng);
    });

    L.control.scale({
        position: 'bottomright',
        metric: true,
        imperial: false
    }).addTo(gpsMapInstance);

    const legend = L.control({ position: 'bottomleft' });
    legend.onAdd = function() {
        const div = L.DomUtil.create('div', 'info legend');
        div.style.background = 'rgba(20, 30, 40, 0.9)';
        div.style.color = '#eaeef2';
        div.style.padding = '6px 12px';
        div.style.borderRadius = '8px';
        div.style.fontSize = '0.8rem';
        div.style.border = '1px solid #2a323c';
        div.innerHTML = `<span style="color:#2ecc71;">●</span> Radius ${GPS_RADIUS}m`;
        return div;
    };
    legend.addTo(gpsMapInstance);

    setTimeout(() => {
        if (gpsMapInstance) {
            gpsMapInstance.invalidateSize();
        }
    }, 200);

    updateGpsMarker(lat, lng);
}

function updateGpsMarker(lat, lng) {
    if (gpsMarker) {
        gpsMarker.setLatLng([lat, lng]);
    } else {
        const redIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color:#e74c3c;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;position:relative;top:-10px;left:-10px;"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        });
        
        gpsMarker = L.marker([lat, lng], {
            draggable: true,
            icon: redIcon
        }).addTo(gpsMapInstance);
        
        gpsMarker.on('dragend', function(e) {
            const pos = e.target.getLatLng();
            updateGpsInfo(pos.lat, pos.lng);
        });
    }

    if (gpsCircle) {
        gpsCircle.setLatLng([lat, lng]);
    } else {
        gpsCircle = L.circle([lat, lng], {
            color: '#2ecc71',
            fillColor: '#2ecc71',
            fillOpacity: 0.15,
            radius: GPS_RADIUS,
            weight: 2,
            opacity: 0.8
        }).addTo(gpsMapInstance);
    }

    updateGpsInfo(lat, lng);
}

function updateGpsInfo(lat, lng) {
    if (gpsLatDisplay) gpsLatDisplay.textContent = lat.toFixed(6);
    if (gpsLngDisplay) gpsLngDisplay.textContent = lng.toFixed(6);
    if (gpsStatusMsg) {
        gpsStatusMsg.textContent = `📍 Titik dipilih: ${lat.toFixed(6)}, ${lng.toFixed(6)} (Radius ${GPS_RADIUS}m)`;
        gpsStatusMsg.style.color = '#5f9ef0';
    }
}

function openGpsModal() {
    if (STATE.isGpsModalOpen) return;
    
    STATE.isGpsModalOpen = true;
    gpsModal.classList.add('show');
    if (gpsAccessCode) gpsAccessCode.value = '';
    if (gpsSearchInput) gpsSearchInput.value = '';
    
    const defaultLat = GPS_LOCATION ? GPS_LOCATION.lat : DEFAULT_LAT;
    const defaultLng = GPS_LOCATION ? GPS_LOCATION.lng : DEFAULT_LNG;
    
    if (gpsLatDisplay) gpsLatDisplay.textContent = defaultLat.toFixed(6);
    if (gpsLngDisplay) gpsLngDisplay.textContent = defaultLng.toFixed(6);
    if (gpsStatusMsg) {
        gpsStatusMsg.textContent = GPS_LOCATION ? 
            `📍 Lokasi aktif: ${GPS_LOCATION.lat.toFixed(6)}, ${GPS_LOCATION.lng.toFixed(6)} (Radius ${GPS_RADIUS}m)` :
            'Klik peta atau cari lokasi untuk menentukan titik';
        gpsStatusMsg.style.color = GPS_LOCATION ? '#2ecc71' : '#6a7e94';
    }
    
    setTimeout(() => {
        initGpsMap(defaultLat, defaultLng);
        setTimeout(() => {
            if (gpsMapInstance) {
                gpsMapInstance.invalidateSize();
            }
        }, 100);
    }, 300);
}

function closeGpsModal() {
    STATE.isGpsModalOpen = false;
    gpsModal.classList.remove('show');
    
    if (gpsMapInstance) {
        gpsMapInstance.off();
        gpsMapInstance.remove();
        gpsMapInstance = null;
        gpsMarker = null;
        gpsCircle = null;
        gpsGeocoder = null;
    }
}

async function saveGpsLocation() {
    const code = gpsAccessCode ? gpsAccessCode.value.trim() : '';
    const statusMsg = gpsStatusMsg;
    
    if (code !== ACCESS_CODE) {
        if (statusMsg) {
            statusMsg.textContent = '❌ Kode akses salah!';
            statusMsg.style.color = '#e74c3c';
        }
        showToast('❌ Kode akses salah!', 'error');
        return;
    }

    if (!gpsMarker) {
        if (statusMsg) {
            statusMsg.textContent = '❌ Tentukan lokasi terlebih dahulu!';
            statusMsg.style.color = '#e74c3c';
        }
        showToast('❌ Tentukan lokasi terlebih dahulu!', 'error');
        return;
    }

    const position = gpsMarker.getLatLng();
    const lat = position.lat;
    const lng = position.lng;

    const saved = await saveGpsToFirebase(lat, lng);
    if (!saved) {
        if (statusMsg) {
            statusMsg.textContent = '❌ Gagal menyimpan lokasi!';
            statusMsg.style.color = '#e74c3c';
        }
        showToast('❌ Gagal menyimpan lokasi!', 'error');
        return;
    }

    GPS_LOCATION = { lat, lng };
    updateGpsDisplay();
    closeGpsModal();
    
    showToast(`✅ Lokasi absen diatur: ${lat.toFixed(6)}, ${lng.toFixed(6)} (Radius ${GPS_RADIUS}m)`, 'success');
    console.log('✅ Lokasi GPS berhasil disimpan');
}

if (gpsSearchInput) {
    gpsSearchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            if (gpsGeocoder && this.value.trim()) {
                gpsGeocoder.geocode(this.value.trim(), function(results) {
                    if (results && results.length > 0) {
                        const center = results[0].center;
                        if (gpsMapInstance) {
                            gpsMapInstance.setView([center.lat, center.lng], 17);
                        }
                        updateGpsMarker(center.lat, center.lng);
                    }
                });
            }
        }
    });
}

// ============================================================
// IZIN PULANG - ABSEN PULANG LEBIH AWAL
// ============================================================
function openIzinPulangModal() {
    if (STATE.isIzinPulangModalOpen) return;
    
    if (STATE.registered.length === 0) {
        showToast('⚠️ Belum ada wajah terdaftar!', 'warning');
        return;
    }

    if (!STATE.isDetecting) {
        showToast('⚠️ Nyalakan deteksi terlebih dahulu!', 'warning');
        return;
    }

    STATE.isIzinPulangModalOpen = true;
    izinPulangModal.classList.add('show');
    izinAccessCode.value = '';
    izinNamaInput.value = '';
    izinStatus.textContent = 'Masukkan nama dan kode akses';
    izinStatus.style.color = '#6a7e94';
    submitIzinBtn.disabled = false;
}

function closeIzinPulangModalFn() {
    STATE.isIzinPulangModalOpen = false;
    izinPulangModal.classList.remove('show');
}

async function submitIzinPulang() {
    const code = izinAccessCode.value.trim();
    const nama = izinNamaInput.value.trim();

    if (!code) {
        izinStatus.textContent = '❌ Masukkan kode akses!';
        izinStatus.style.color = '#e74c3c';
        return;
    }

    if (code !== ACCESS_CODE) {
        izinStatus.textContent = '❌ Kode akses salah!';
        izinStatus.style.color = '#e74c3c';
        showToast('❌ Kode akses salah!', 'error');
        return;
    }

    if (!nama) {
        izinStatus.textContent = '❌ Masukkan nama!';
        izinStatus.style.color = '#e74c3c';
        return;
    }

    const face = STATE.registered.find(f => f.name.toLowerCase() === nama.toLowerCase());
    if (!face) {
        izinStatus.textContent = `❌ Nama "${nama}" tidak ditemukan!`;
        izinStatus.style.color = '#e74c3c';
        showToast(`❌ Nama "${nama}" tidak ditemukan!`, 'error');
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour12: false });
    const now = new Date();
    const jam = now.getHours();
    const menit = now.getMinutes();

    const existingHistory = STATE.attendanceHistory.find(h =>
        h.name === face.name && h.date === today
    );

    try {
        const lokasi = await cekLokasi();
        if (!lokasi.valid) {
            izinStatus.textContent = `📍 ${lokasi.error}`;
            izinStatus.style.color = '#e74c3c';
            showToast(`📍 ${face.name} - ${lokasi.error}`, 'warning');
            return;
        }

        izinStatus.textContent = '⏳ Memproses izin pulang...';
        izinStatus.style.color = '#f39c12';
        submitIzinBtn.disabled = true;

        const record = {
            name: face.name,
            status: 'izin_pulang',
            type: 'izin_pulang',
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            date: today,
            time: timeStr,
            jamAbsen: `${String(jam).padStart(2, '0')}:${String(menit).padStart(2, '0')}`,
            clientTime: new Date().toISOString(),
            location: {
                lat: lokasi.lat,
                lng: lokasi.lng,
                distance: lokasi.distance
            },
            note: 'Izin pulang lebih awal'
        };

        if (existingHistory) {
            await db.ref('attendance/' + today + '/individuals/' + existingHistory.id).remove();
            
            const ref = db.ref('attendance/' + today + '/individuals').push();
            await ref.set(record);

            const index = STATE.attendanceHistory.findIndex(h => h.id === existingHistory.id);
            if (index !== -1) {
                STATE.attendanceHistory[index] = {
                    id: ref.key,
                    name: face.name,
                    status: 'izin_pulang',
                    time: timeStr,
                    date: today,
                    timestamp: Date.now(),
                    type: 'izin_pulang',
                    jamAbsen: record.jamAbsen,
                    location: record.location,
                    note: 'Izin pulang lebih awal'
                };
            }
        } else {
            const ref = db.ref('attendance/' + today + '/individuals').push();
            await ref.set(record);

            STATE.attendanceHistory.unshift({
                id: ref.key,
                name: face.name,
                status: 'izin_pulang',
                time: timeStr,
                date: today,
                timestamp: Date.now(),
                type: 'izin_pulang',
                jamAbsen: record.jamAbsen,
                location: record.location,
                note: 'Izin pulang lebih awal'
            });

            STATE.attendance[face.id] = true;
        }

        STATE.updateCount++;
        STATE.lastUpdateTime = Date.now();
        STATE.autoAbsenCooldown[face.name] = Date.now();

        renderHistory();
        updateStatusBar();
        updateAbsenCount();

        izinStatus.textContent = `✅ ${face.name} - IZIN PULANG ${timeStr}`;
        izinStatus.style.color = '#2ecc71';
        showToast(`✅ ${face.name} - IZIN PULANG ${timeStr} (${lokasi.distance.toFixed(1)}m)`, 'success');
        console.log(`✅ Izin Pulang: ${face.name} pada ${timeStr}, jarak ${lokasi.distance.toFixed(1)}m`);

        setTimeout(() => {
            closeIzinPulangModalFn();
            submitIzinBtn.disabled = false;
        }, 1500);

    } catch (error) {
        console.error('❌ Gagal izin pulang:', error);
        izinStatus.textContent = '❌ Gagal: ' + error.message;
        izinStatus.style.color = '#e74c3c';
        showToast('❌ Gagal izin pulang: ' + error.message, 'error');
        submitIzinBtn.disabled = false;
    }
}

// ============================================================
// EXPORT EXCEL MINGGUAN
// ============================================================

function openExportModal() {
    if (STATE.isExportModalOpen) return;
    
    STATE.isExportModalOpen = true;
    exportModal.classList.add('show');
    
    const now = new Date();
    if (exportYear) exportYear.value = now.getFullYear();
    if (exportWeek) exportWeek.value = getWeekNumber(now);
    if (exportStatus) {
        exportStatus.textContent = 'Pilih minggu dan tahun, lalu klik Export';
        exportStatus.style.color = '#6a7e94';
    }
}

function closeExportModal() {
    STATE.isExportModalOpen = false;
    exportModal.classList.remove('show');
}

function getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

function getDateRangeOfWeek(week, year) {
    const d = new Date(year, 0, 1);
    const dayOffset = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - dayOffset + (week - 1) * 7);
    const start = new Date(d);
    const end = new Date(d);
    end.setDate(end.getDate() + 6);
    return { start, end };
}

async function exportExcel() {
    const week = parseInt(exportWeek ? exportWeek.value : 0);
    const year = parseInt(exportYear ? exportYear.value : 0);
    
    if (isNaN(week) || week < 1 || week > 53) {
        if (exportStatus) {
            exportStatus.textContent = '❌ Minggu harus 1-53';
            exportStatus.style.color = '#e74c3c';
        }
        showToast('❌ Minggu harus 1-53', 'error');
        return;
    }
    
    if (isNaN(year) || year < 2020 || year > 2030) {
        if (exportStatus) {
            exportStatus.textContent = '❌ Tahun harus 2020-2030';
            exportStatus.style.color = '#e74c3c';
        }
        showToast('❌ Tahun harus 2020-2030', 'error');
        return;
    }

    if (exportStatus) {
        exportStatus.textContent = '⏳ Mengambil data...';
        exportStatus.style.color = '#f39c12';
    }
    if (doExportBtn) doExportBtn.disabled = true;

    try {
        const { start, end } = getDateRangeOfWeek(week, year);
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];
        
        console.log(`📊 Export minggu ${week} tahun ${year}: ${startStr} - ${endStr}`);
        
        const snapshot = await db.ref('attendance').once('value');
        const data = snapshot.val();
        
        if (!data) {
            if (exportStatus) {
                exportStatus.textContent = '❌ Tidak ada data absensi';
                exportStatus.style.color = '#e74c3c';
            }
            showToast('❌ Tidak ada data absensi', 'error');
            if (doExportBtn) doExportBtn.disabled = false;
            return;
        }

        const allHistory = [];
        
        Object.keys(data).forEach(dateKey => {
            if (dateKey >= startStr && dateKey <= endStr) {
                const dayData = data[dateKey];
                if (dayData && dayData.individuals) {
                    Object.keys(dayData.individuals).forEach(id => {
                        const item = dayData.individuals[id];
                        if (item.name && item.status) {
                            let statusLabel = item.status === 'hadir' ? 'Masuk' : 'Pulang';
                            if (item.status === 'izin_pulang' || item.type === 'izin_pulang') {
                                statusLabel = 'Izin Pulang';
                            }
                            allHistory.push({
                                tanggal: dateKey,
                                nama: item.name,
                                status: statusLabel,
                                waktu: item.jamAbsen || item.time || '--:--',
                                type: item.type || 'check_in',
                                jarak: item.location && item.location.distance ? 
                                    item.location.distance.toFixed(1) + 'm' : '-',
                                note: item.note || ''
                            });
                        }
                    });
                }
            }
        });

        if (allHistory.length === 0) {
            if (exportStatus) {
                exportStatus.textContent = `❌ Tidak ada data untuk minggu ${week} tahun ${year}`;
                exportStatus.style.color = '#e74c3c';
            }
            showToast(`❌ Tidak ada data untuk minggu ${week} tahun ${year}`, 'error');
            if (doExportBtn) doExportBtn.disabled = false;
            return;
        }

        allHistory.sort((a, b) => a.tanggal.localeCompare(b.tanggal));

        const wb = XLSX.utils.book_new();
        
        const excelData = [
            ['LAPORAN ABSENSI MINGGUAN'],
            [`Minggu ke-${week} Tahun ${year}`],
            [`Periode: ${startStr} - ${endStr}`],
            [`Radius Absen: ${GPS_RADIUS} meter dari titik lokasi`],
            GPS_LOCATION ? [`Titik Lokasi: ${GPS_LOCATION.lat.toFixed(6)}, ${GPS_LOCATION.lng.toFixed(6)}`] : ['Titik Lokasi: Belum diatur'],
            [],
            ['No', 'Tanggal', 'Nama', 'Status', 'Waktu', 'Jarak', 'Catatan']
        ];

        allHistory.forEach((item, index) => {
            const dateFormatted = new Date(item.tanggal + 'T00:00:00').toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            excelData.push([
                index + 1,
                dateFormatted,
                item.nama,
                item.status,
                item.waktu,
                item.jarak,
                item.note
            ]);
        });

        excelData.push([]);
        excelData.push(['Total Data:', allHistory.length]);
        
        const masukCount = allHistory.filter(h => h.status === 'Masuk').length;
        const pulangCount = allHistory.filter(h => h.status === 'Pulang').length;
        const izinCount = allHistory.filter(h => h.status === 'Izin Pulang').length;
        excelData.push(['Total Masuk:', masukCount]);
        excelData.push(['Total Pulang:', pulangCount]);
        excelData.push(['Total Izin Pulang:', izinCount]);

        const ws = XLSX.utils.aoa_to_sheet(excelData);
        
        ws['!cols'] = [
            { wch: 5 },
            { wch: 15 },
            { wch: 20 },
            { wch: 14 },
            { wch: 12 },
            { wch: 15 },
            { wch: 20 }
        ];

        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
            { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } },
            { s: { r: 3, c: 0 }, e: { r: 3, c: 6 } },
            { s: { r: 4, c: 0 }, e: { r: 4, c: 6 } }
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Absensi');
        
        const fileName = `Absensi_Minggu_${week}_${year}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        if (exportStatus) {
            exportStatus.textContent = `✅ Berhasil export ${allHistory.length} data!`;
            exportStatus.style.color = '#2ecc71';
        }
        showToast(`✅ Berhasil export ${allHistory.length} data ke Excel!`, 'success');
        
        setTimeout(() => {
            closeExportModal();
        }, 1500);
        
    } catch (error) {
        console.error('❌ Gagal export:', error);
        if (exportStatus) {
            exportStatus.textContent = '❌ Gagal export: ' + error.message;
            exportStatus.style.color = '#e74c3c';
        }
        showToast('❌ Gagal export: ' + error.message, 'error');
    }
    
    if (doExportBtn) doExportBtn.disabled = false;
}

// ============================================================
// CANVAS
// ============================================================
function resizeCanvas() {
    const w = video.videoWidth || video.clientWidth || 640;
    const h = video.videoHeight || video.clientHeight || 480;
    overlay.width = w;
    overlay.height = h;
    overlay.style.width = '100%';
    overlay.style.height = '100%';
}

function resizePreviewCanvas() {
    const w = previewVideo.videoWidth || previewVideo.clientWidth || 320;
    const h = previewVideo.videoHeight || previewVideo.clientHeight || 240;
    previewOverlay.width = w;
    previewOverlay.height = h;
    previewOverlay.style.width = '100%';
    previewOverlay.style.height = '100%';
}

// ============================================================
// LOAD ALL MODELS
// ============================================================
async function loadAllModels() {
    if (STATE.modelLoaded) {
        return true;
    }
    
    if (STATE.modelLoadingPromise) {
        return await STATE.modelLoadingPromise;
    }
    
    STATE.modelLoadingPromise = new Promise(async (resolve) => {
        const MODEL_URLS = [
            'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights',
            'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'
        ];

        let lastError = null;

        for (const MODEL_URL of MODEL_URLS) {
            try {
                console.log(`📥 Mencoba load model dari: ${MODEL_URL}`);
                modelStatus.innerHTML = `<i class="fas fa-spinner fa-pulse"></i> Memuat model...`;
                modelStatus.className = 'info-badge warning';

                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);

                STATE.modelsLoaded.tinyFaceDetector = true;
                STATE.modelsLoaded.faceLandmark68 = true;
                STATE.modelsLoaded.faceRecognition = true;
                STATE.modelLoaded = true;

                console.log(`✅ Semua model berhasil dimuat dari: ${MODEL_URL}`);
                updateModelStatus();
                showToast('✅ Model AI berhasil dimuat!', 'success');
                
                STATE.modelLoadingPromise = null;
                resolve(true);
                return;

            } catch (err) {
                console.warn(`⚠️ Gagal load dari ${MODEL_URL}:`, err.message);
                lastError = err;
                STATE.modelsLoaded.tinyFaceDetector = false;
                STATE.modelsLoaded.faceLandmark68 = false;
                STATE.modelsLoaded.faceRecognition = false;
                STATE.modelLoaded = false;
            }
        }

        console.error('❌ Semua percobaan load model gagal:', lastError);
        modelStatus.innerHTML = '<i class="fas fa-times-circle"></i> Gagal load model';
        modelStatus.className = 'info-badge error';
        showToast('❌ Gagal memuat model. Periksa koneksi internet.', 'error');
        
        STATE.modelLoadingPromise = null;
        resolve(false);
    });
    
    return await STATE.modelLoadingPromise;
}

// ============================================================
// DETECTION LOOP
// ============================================================
let lastDetectionTime = 0;
const DETECTION_INTERVAL = 150;

async function detectLoop(timestamp) {
    if (!STATE.isDetecting || !STATE.modelLoaded) {
        requestAnimationFrame(detectLoop);
        return;
    }

    if (timestamp - lastDetectionTime < DETECTION_INTERVAL) {
        requestAnimationFrame(detectLoop);
        return;
    }
    lastDetectionTime = timestamp;

    if (!video.videoWidth || !video.videoHeight) {
        requestAnimationFrame(detectLoop);
        return;
    }

    try {
        const detections = await faceapi.detectAllFaces(
            video,
            new faceapi.TinyFaceDetectorOptions({
                inputSize: 224,
                scoreThreshold: 0.4
            })
        );

        STATE.faceCount = detections.length;
        detectionInfo.innerHTML = `<i class="fas fa-eye"></i> Wajah: ${STATE.faceCount}`;

        if (detections.length === 0) {
            ctx.clearRect(0, 0, overlay.width, overlay.height);
            STATE.detectedFaces = [];
            requestAnimationFrame(detectLoop);
            return;
        }

        const fullDetections = await faceapi.detectAllFaces(
            video,
            new faceapi.TinyFaceDetectorOptions({
                inputSize: 224,
                scoreThreshold: 0.4
            })
        ).withFaceLandmarks().withFaceDescriptors();

        const w = overlay.width;
        const h = overlay.height;
        ctx.clearRect(0, 0, w, h);

        STATE.detectedFaces = [];

        for (const detection of fullDetections) {
            const box = detection.detection.box;
            const descriptor = detection.descriptor;
            const x = box.x,
                y = box.y,
                width = box.width,
                height = box.height;

            let matchId = null;
            let matchName = null;
            let minDist = 0.6;

            for (const reg of STATE.registered) {
                if (!reg.descriptor || !reg.descriptor.length) continue;
                try {
                    const regDesc = new Float32Array(reg.descriptor);
                    const dist = faceapi.euclideanDistance(descriptor, regDesc);
                    
                    if (dist < minDist && dist < FACE_MATCH_THRESHOLD) {
                        minDist = dist;
                        matchId = reg.id;
                        matchName = reg.name;
                    }
                } catch (e) {
                    console.warn('Error comparing descriptor:', e);
                }
            }

            const isMatch = matchId !== null;
            const color = isMatch ? '#2ecc71' : '#4a9eff';
            const shadowColor = isMatch ? '#1a8a4a' : '#1f6fcf';

            ctx.strokeStyle = color;
            ctx.lineWidth = Math.max(2.5, w / 200);
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur = 14;
            ctx.strokeRect(x, y, width, height);

            ctx.shadowBlur = 18;
            ctx.lineWidth = Math.max(2, w / 250);
            ctx.strokeStyle = color;
            const cs = Math.min(14, width / 6);

            ctx.beginPath();
            ctx.moveTo(x, y + cs);
            ctx.lineTo(x, y);
            ctx.lineTo(x + cs, y);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x + width - cs, y);
            ctx.lineTo(x + width, y);
            ctx.lineTo(x + width, y + cs);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x, y + height - cs);
            ctx.lineTo(x, y + height);
            ctx.lineTo(x + cs, y + height);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x + width - cs, y + height);
            ctx.lineTo(x + width, y + height);
            ctx.lineTo(x + width, y + height - cs);
            ctx.stroke();

            ctx.shadowBlur = 8;
            ctx.font = `bold ${Math.max(13, w / 32)}px 'Segoe UI', sans-serif`;
            ctx.fillStyle = isMatch ? '#b0f0c8' : '#d0e4ff';
            ctx.shadowColor = '#0a1a2e';

            if (isMatch) {
                const hadir = STATE.attendance[matchId] === true;
                const hasUpdate = STATE.attendanceHistory.some(h => h.name === matchName && h.type === 'update_time');
                let label = hadir ? `✅ ${matchName} ✓` : `🔄 ${matchName}...`;
                if (hadir && hasUpdate) label = `🔄 ${matchName} ↻`;
                ctx.fillText(label, x + 6, y - 6);

                const existing = STATE.detectedFaces.find(f => f.id === matchId);
                if (!existing) {
                    STATE.detectedFaces.push({ id: matchId, name: matchName });
                    await autoAbsen(matchName, matchId);
                }
            } else {
                ctx.fillText('👤 ?', x + 6, y - 6);
            }
        }

        ctx.shadowBlur = 0;

    } catch (err) {
        console.warn('Deteksi error:', err);
        detectionInfo.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Error: ${err.message}`;
        detectionInfo.className = 'info-badge error';
    }

    requestAnimationFrame(detectLoop);
}

// ============================================================
// START / STOP / CAMERA ONLY
// ============================================================

async function startCameraOnly() {
    if (STATE.isDetecting) return;
    
    try {
        STATE.stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        });
        video.srcObject = STATE.stream;
        await video.play();
        placeholderCam.style.display = 'none';
        
        await new Promise(resolve => {
            if (video.videoWidth > 0) resolve();
            else video.addEventListener('loadedmetadata', resolve, { once: true });
        });
        resizeCanvas();
        
        setStatus(false, 'kamera aktif - siap daftar');
        detectionInfo.innerHTML = '<i class="fas fa-camera"></i> Kamera aktif, silakan daftar wajah';
        detectionInfo.className = 'info-badge success';
        
        console.log('📷 Kamera aktif (mode registrasi)');
        showToast('📷 Kamera aktif - siap registrasi wajah', 'info');
        
    } catch (err) {
        console.error('Gagal akses kamera:', err);
        let msg = 'Gagal akses kamera.';
        if (err.name === 'NotAllowedError') msg += ' Izin kamera ditolak.';
        else if (err.name === 'NotFoundError') msg += ' Kamera tidak ditemukan.';
        showToast(msg, 'error');
    }
}

async function autoStartDetection() {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (STATE.isInitialized && STATE.registered.length > 0) {
        console.log('🚀 Auto-starting detection...');
        await startDetection();
    } else if (STATE.isInitialized && STATE.registered.length === 0) {
        console.log('⚠️ Belum ada wajah terdaftar, tidak auto-start');
        await startCameraOnly();
    } else {
        console.log('⏳ Menunggu inisialisasi selesai...');
        const checkInit = setInterval(async () => {
            if (STATE.isInitialized) {
                clearInterval(checkInit);
                if (STATE.registered.length > 0) {
                    await startDetection();
                } else {
                    await startCameraOnly();
                }
            }
        }, 500);
    }
}

async function startDetection() {
    if (STATE.isDetecting) return;

    startBtn.disabled = true;
    setStatus(false, 'mengakses kamera...', true);

    try {
        if (!STATE.stream) {
            STATE.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });
            video.srcObject = STATE.stream;
            await video.play();
            placeholderCam.style.display = 'none';

            await new Promise(resolve => {
                if (video.videoWidth > 0) resolve();
                else video.addEventListener('loadedmetadata', resolve, { once: true });
            });
            resizeCanvas();
        }

        if (!STATE.modelLoaded) {
            const success = await loadAllModels();
            if (!success) {
                throw new Error('Gagal memuat model');
            }
        }

        STATE.isDetecting = true;
        setStatus(true, 'deteksi berjalan');
        startBtn.disabled = true;
        stopBtn.disabled = false;
        statusDot.className = 'dot auto';
        autoStatus.innerHTML = '<i class="fas fa-magic"></i> Auto: aktif';
        autoStatus.className = 'info-badge auto';

        lastDetectionTime = 0;
        requestAnimationFrame(detectLoop);
        
        showToast('✅ Deteksi wajah aktif!', 'success');

    } catch (err) {
        console.error('Start error:', err);
        setStatus(false, 'gagal: ' + (err.message || 'unknown'));
        if (STATE.stream) {
            STATE.stream.getTracks().forEach(t => t.stop());
            STATE.stream = null;
        }
        video.srcObject = null;
        startBtn.disabled = false;
        stopBtn.disabled = true;

        let msg = 'Gagal akses kamera atau model.';
        if (err.name === 'NotAllowedError') msg += ' Izin kamera ditolak.';
        else if (err.name === 'NotFoundError') msg += ' Kamera tidak ditemukan.';
        showToast(msg, 'error');
    }
}

function stopDetection() {
    STATE.isDetecting = false;
    if (STATE.stream) {
        STATE.stream.getTracks().forEach(t => t.stop());
        STATE.stream = null;
    }
    video.srcObject = null;
    video.load();
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    placeholderCam.style.display = 'block';
    STATE.detectedFaces = [];
    STATE.faceCount = 0;
    detectionInfo.innerHTML = '<i class="fas fa-eye"></i> Menunggu deteksi...';
    detectionInfo.className = 'info-badge';

    setStatus(false, 'dihentikan');
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusDot.className = 'dot inactive';
    autoStatus.innerHTML = '<i class="fas fa-magic"></i> Auto: nonaktif';
    autoStatus.className = 'info-badge';
    updateStatusBar();
}

// ============================================================
// MODAL REGISTRASI
// ============================================================

async function openRegisterModal() {
    if (STATE.isModalOpen) return;
    
    const code = prompt('Masukkan Kode Akses untuk Registrasi:');
    if (code === null) return;
    
    if (code !== ACCESS_CODE) {
        showToast('❌ Kode akses salah!', 'error');
        return;
    }
    
    STATE.isModalOpen = true;
    registerModal.classList.add('show');
    registerStatus.textContent = 'Siap mendaftar';
    registerName.value = '';
    accessCode.value = '';
    previewInfo.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Menyiapkan kamera...';
    previewInfo.className = 'preview-info warning';
    
    if (STATE.isDetecting) {
        stopDetection();
    }
    
    if (!STATE.modelLoaded) {
        previewInfo.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Memuat model AI...';
        previewInfo.className = 'preview-info warning';
        await loadAllModels();
    }
    
    try {
        if (STATE.previewStream) {
            STATE.previewStream.getTracks().forEach(t => t.stop());
        }
        
        STATE.previewStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 320 },
                height: { ideal: 240 }
            }
        });
        previewVideo.srcObject = STATE.previewStream;
        await previewVideo.play();
        previewPlaceholder.style.display = 'none';
        
        await new Promise(resolve => {
            if (previewVideo.videoWidth > 0) {
                resolve();
            } else {
                previewVideo.addEventListener('loadedmetadata', resolve, { once: true });
            }
        });
        resizePreviewCanvas();
        
        setTimeout(() => {
            startPreviewDetection();
        }, 300);
        
        previewInfo.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Mendeteksi wajah...';
        previewInfo.className = 'preview-info active';
        
        console.log('📷 Preview kamera aktif, width:', previewVideo.videoWidth, 'height:', previewVideo.videoHeight);
        
    } catch (err) {
        console.error('❌ Gagal buka kamera preview:', err);
        showToast('❌ Gagal buka kamera preview: ' + err.message, 'error');
        previewInfo.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Gagal buka kamera';
        previewInfo.className = 'preview-info error';
    }
}

function closeRegisterModal() {
    STATE.isModalOpen = false;
    registerModal.classList.remove('show');
    
    stopPreviewDetection();
    
    if (STATE.previewStream) {
        STATE.previewStream.getTracks().forEach(t => t.stop());
        STATE.previewStream = null;
    }
    previewVideo.srcObject = null;
    previewPlaceholder.style.display = 'flex';
    previewInfo.innerHTML = '<i class="fas fa-eye"></i> Menunggu wajah...';
    previewInfo.className = 'preview-info';
    previewCtx.clearRect(0, 0, previewOverlay.width, previewOverlay.height);
    
    if (STATE.registered.length > 0) {
        startDetection();
    } else {
        startCameraOnly();
    }
}

// ============================================================
// PREVIEW DETECTION
// ============================================================
let previewDetectInterval = null;
let previewRetryCount = 0;
const MAX_PREVIEW_RETRY = 10;

function startPreviewDetection() {
    if (previewDetectInterval) {
        clearInterval(previewDetectInterval);
        previewDetectInterval = null;
    }
    
    previewRetryCount = 0;
    
    previewDetectInterval = setInterval(async () => {
        if (!STATE.isModalOpen) {
            return;
        }
        
        if (!previewVideo.videoWidth || !previewVideo.videoHeight) {
            previewInfo.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Menunggu kamera...';
            previewInfo.className = 'preview-info warning';
            return;
        }
        
        if (!STATE.modelLoaded) {
            previewInfo.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Memuat model AI...';
            previewInfo.className = 'preview-info warning';
            
            const success = await loadAllModels();
            if (!success) {
                previewRetryCount++;
                if (previewRetryCount > MAX_PREVIEW_RETRY) {
                    previewInfo.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Gagal memuat model. Refresh halaman.';
                    previewInfo.className = 'preview-info error';
                }
                return;
            }
            return;
        }
        
        previewRetryCount = 0;
        
        try {
            const detections = await faceapi.detectAllFaces(
                previewVideo,
                new faceapi.TinyFaceDetectorOptions({
                    inputSize: 224,
                    scoreThreshold: 0.4
                })
            ).withFaceLandmarks().withFaceDescriptors();
            
            const w = previewOverlay.width;
            const h = previewOverlay.height;
            previewCtx.clearRect(0, 0, w, h);
            
            if (!detections || detections.length === 0) {
                previewInfo.innerHTML = '<i class="fas fa-eye-slash"></i> Tidak ada wajah';
                previewInfo.className = 'preview-info warning';
                return;
            }
            
            if (detections.length > 1) {
                previewInfo.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${detections.length} wajah - hanya 1 yang boleh`;
                previewInfo.className = 'preview-info error';
            } else {
                previewInfo.innerHTML = '<i class="fas fa-check-circle"></i> 1 wajah terdeteksi ✅';
                previewInfo.className = 'preview-info success';
            }
            
            detections.forEach(det => {
                const box = det.detection.box;
                const x = box.x,
                    y = box.y,
                    width = box.width,
                    height = box.height;
                
                const isSingle = detections.length === 1;
                previewCtx.strokeStyle = isSingle ? '#2ecc71' : '#e74c3c';
                previewCtx.lineWidth = 3;
                previewCtx.shadowColor = isSingle ? '#2ecc7155' : '#e74c3c55';
                previewCtx.shadowBlur = 12;
                previewCtx.strokeRect(x, y, width, height);
                
                previewCtx.shadowBlur = 0;
                previewCtx.lineWidth = 2;
                const cs = Math.min(10, width / 8);
                
                previewCtx.beginPath();
                previewCtx.moveTo(x, y + cs);
                previewCtx.lineTo(x, y);
                previewCtx.lineTo(x + cs, y);
                previewCtx.stroke();
                
                previewCtx.beginPath();
                previewCtx.moveTo(x + width - cs, y);
                previewCtx.lineTo(x + width, y);
                previewCtx.lineTo(x + width, y + cs);
                previewCtx.stroke();
                
                previewCtx.beginPath();
                previewCtx.moveTo(x, y + height - cs);
                previewCtx.lineTo(x, y + height);
                previewCtx.lineTo(x + cs, y + height);
                previewCtx.stroke();
                
                previewCtx.beginPath();
                previewCtx.moveTo(x + width - cs, y + height);
                previewCtx.lineTo(x + width, y + height);
                previewCtx.lineTo(x + width, y + height - cs);
                previewCtx.stroke();
            });
            
        } catch (err) {
            console.error('❌ Preview detection error:', err);
            previewInfo.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Error: ${err.message || 'deteksi gagal'}`;
            previewInfo.className = 'preview-info error';
        }
    }, 300);
}

function stopPreviewDetection() {
    if (previewDetectInterval) {
        clearInterval(previewDetectInterval);
        previewDetectInterval = null;
    }
}

// ============================================================
// REGISTER FACE FROM MODAL
// ============================================================
async function registerFace() {
    const name = registerName.value.trim();
    const code = accessCode.value.trim();

    if (!name) {
        showToast('Masukkan nama terlebih dahulu', 'error');
        registerStatus.textContent = '⚠️ Masukkan nama!';
        registerName.focus();
        return;
    }

    if (!code) {
        showToast('Masukkan kode akses!', 'error');
        registerStatus.textContent = '⚠️ Masukkan kode akses!';
        accessCode.focus();
        return;
    }

    if (code !== ACCESS_CODE) {
        showToast('❌ Kode akses salah!', 'error');
        registerStatus.textContent = '❌ Kode akses salah!';
        accessCode.value = '';
        accessCode.focus();
        return;
    }

    if (!previewVideo.videoWidth || !STATE.previewStream) {
        showToast('Kamera preview tidak aktif', 'error');
        registerStatus.textContent = '⚠️ Kamera tidak aktif!';
        return;
    }

    if (STATE.isRegistering) {
        showToast('⏳ Proses registrasi sedang berjalan...', 'info');
        return;
    }

    STATE.isRegistering = true;
    registerBtn.disabled = true;
    registerStatus.textContent = '⏳ Mendeteksi wajah...';
    showToast('⏳ Mendeteksi wajah...', 'info');

    try {
        if (!STATE.modelLoaded) {
            await loadAllModels();
            if (!STATE.modelLoaded) {
                throw new Error('Model gagal dimuat');
            }
        }
        
        const detections = await faceapi.detectAllFaces(
            previewVideo,
            new faceapi.TinyFaceDetectorOptions({
                inputSize: 224,
                scoreThreshold: 0.4
            })
        ).withFaceLandmarks().withFaceDescriptors();

        console.log('Deteksi hasil:', detections.length, 'wajah');

        if (detections.length === 0) {
            showToast('❌ Tidak ada wajah terdeteksi', 'error');
            registerStatus.textContent = '❌ Tidak ada wajah!';
            STATE.isRegistering = false;
            registerBtn.disabled = false;
            return;
        }

        if (detections.length > 1) {
            showToast('❌ Hanya satu wajah yang boleh didaftarkan', 'error');
            registerStatus.textContent = '❌ Terlalu banyak wajah!';
            STATE.isRegistering = false;
            registerBtn.disabled = false;
            return;
        }

        const descriptor = detections[0].descriptor;

        if (!descriptor || descriptor.length === 0) {
            showToast('❌ Gagal mendapatkan fitur wajah', 'error');
            registerStatus.textContent = '❌ Gagal ekstrak fitur!';
            STATE.isRegistering = false;
            registerBtn.disabled = false;
            return;
        }

        console.log('Descriptor length:', descriptor.length);

        let duplicate = false;
        let duplicateName = '';
        for (const reg of STATE.registered) {
            if (!reg.descriptor || !reg.descriptor.length) continue;
            try {
                const regDesc = new Float32Array(reg.descriptor);
                const dist = faceapi.euclideanDistance(descriptor, regDesc);
                console.log(`Distance to "${reg.name}":`, dist);
                if (dist < FACE_MATCH_THRESHOLD) {
                    duplicate = true;
                    duplicateName = reg.name;
                    break;
                }
            } catch (e) {
                console.warn('Error comparing:', e);
            }
        }

        if (duplicate) {
            showToast(`❌ Wajah ini sudah terdaftar sebagai "${duplicateName}"!`, 'error');
            registerStatus.textContent = `❌ Duplikat: ${duplicateName}`;
            STATE.isRegistering = false;
            registerBtn.disabled = false;
            return;
        }

        const id = await tambahWajah(name, descriptor);
        if (id) {
            registerStatus.textContent = `✅ "${name}" terdaftar di Firebase!`;
            showToast(`✅ "${name}" berhasil didaftarkan!`, 'success');
            registerName.value = '';
            accessCode.value = '';
            setTimeout(() => {
                closeRegisterModal();
            }, 1500);
        } else {
            registerStatus.textContent = '❌ Gagal menyimpan ke Firebase!';
        }

    } catch (err) {
        console.error('Register error:', err);
        showToast('❌ Error: ' + err.message, 'error');
        registerStatus.textContent = '❌ Error: ' + err.message;
    }

    STATE.isRegistering = false;
    registerBtn.disabled = false;
}

// ============================================================
// INITIALIZE
// ============================================================
async function initApp() {
    const isAllowed = await checkIpWhitelist();
    if (!isAllowed) {
        return;
    }

    try {
        await db.ref('.info/connected').once('value');
        updateFirebaseStatus(true);
        console.log('✅ Firebase Realtime Database terhubung');

        console.log('⏳ Memulai loadSettingsFromFirebase...');
        await loadSettingsFromFirebase();

        await loadFacesFromFirebase();
        await loadHistoryFromFirebase();

        STATE.lastSync = Date.now();
        updateLastSync();
        STATE.isInitialized = true;

        setStatus(false, 'siap');
        detectionInfo.innerHTML = '<i class="fas fa-eye"></i> Klik "Mulai" untuk memulai deteksi';
        registerStatus.textContent = 'Siap mendaftar';
        updateModelStatus();
        updateAbsenCount();
        updateStatusBar();
        updateJamDisplay();
        updateGpsDisplay();

        console.log('👽 Face Attendance dengan Auto Absen & Update Time siap!');
        console.log('Data wajah:', STATE.registered.length, 'orang');
        console.log('📋 Jam Masuk Batas:', JAM_MASUK_BATAS + ':00');
        console.log('📋 Jam Pulang Mulai:', JAM_PULANG_MULAI + ':00');
        console.log('📍 Lokasi Absen:', GPS_LOCATION ? `${GPS_LOCATION.lat}, ${GPS_LOCATION.lng}` : 'Belum diatur');

        if (!STATE.modelLoaded) {
            loadAllModels();
        }

        await autoStartDetection();

    } catch (error) {
        console.error('❌ Gagal inisialisasi:', error);
        updateFirebaseStatus(false, error.message);
        faceListEl.innerHTML = `<div class="empty-list">❌ Gagal terhubung ke Firebase: ${error.message}</div>`;
        showToast('❌ Gagal terhubung ke Firebase: ' + error.message, 'error');
    }
}

// ============================================================
// EVENT LISTENERS
// ============================================================
startBtn.addEventListener('click', startDetection);
stopBtn.addEventListener('click', stopDetection);
resetBtn.addEventListener('click', resetSemua);
syncBtn.addEventListener('click', syncFacesToFirebase);

// SYNC ALL BUTTON
if (syncAllBtn) {
    syncAllBtn.addEventListener('click', async function() {
        const btn = this;
        const originalHtml = btn.innerHTML;
        
        const code = prompt('Masukkan Kode Akses untuk sinkronisasi semua data:');
        if (code === null) return;
        
        if (code !== ACCESS_CODE) {
            showToast('❌ Kode akses salah!', 'error');
            return;
        }
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sinkron...';
        btn.disabled = true;
        
        await syncAllData();
        
        btn.innerHTML = originalHtml;
        btn.disabled = false;
    });
}

// IZIN PULANG BUTTON
if (izinPulangBtn) {
    izinPulangBtn.addEventListener('click', openIzinPulangModal);
}

// IZIN PULANG MODAL EVENTS
if (closeIzinPulangModal) {
    closeIzinPulangModal.addEventListener('click', closeIzinPulangModalFn);
}

if (cancelIzinBtn) {
    cancelIzinBtn.addEventListener('click', closeIzinPulangModalFn);
}

if (submitIzinBtn) {
    submitIzinBtn.addEventListener('click', submitIzinPulang);
}

if (izinPulangModal) {
    izinPulangModal.addEventListener('click', (e) => {
        if (e.target === izinPulangModal) {
            closeIzinPulangModalFn();
        }
    });
}

// IZIN PULANG - ENTER KEY SUPPORT
if (izinNamaInput) {
    izinNamaInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            if (izinAccessCode) izinAccessCode.focus();
        }
    });
}

if (izinAccessCode) {
    izinAccessCode.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            submitIzinPulang();
        }
    });
}

showRegisterBtn.addEventListener('click', openRegisterModal);
closeModalBtn.addEventListener('click', closeRegisterModal);
cancelRegisterBtn.addEventListener('click', closeRegisterModal);
registerBtn.addEventListener('click', registerFace);

registerModal.addEventListener('click', (e) => {
    if (e.target === registerModal) {
        closeRegisterModal();
    }
});

registerName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        accessCode.focus();
    }
});

accessCode.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        registerFace();
    }
});

jamInfoBadge.addEventListener('click', openJamModal);
closeJamBtn.addEventListener('click', closeJamModal);
cancelJamBtn.addEventListener('click', closeJamModal);
saveJamBtn.addEventListener('click', saveJamSettings);

jamModal.addEventListener('click', (e) => {
    if (e.target === jamModal) {
        closeJamModal();
    }
});

jamAccessCode.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        jamMasukInput.focus();
    }
});

jamMasukInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        jamPulangInput.focus();
    }
});

jamPulangInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        saveJamSettings();
    }
});

gpsBadge.addEventListener('click', openGpsModal);
closeGpsBtn.addEventListener('click', closeGpsModal);
cancelGpsBtn.addEventListener('click', closeGpsModal);
saveGpsBtn.addEventListener('click', saveGpsLocation);

gpsModal.addEventListener('click', (e) => {
    if (e.target === gpsModal) {
        closeGpsModal();
    }
});

gpsAccessCode.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (gpsSearchInput) gpsSearchInput.focus();
    }
});

exportExcelBtn.addEventListener('click', openExportModal);
closeExportBtn.addEventListener('click', closeExportModal);
cancelExportBtn.addEventListener('click', closeExportModal);
doExportBtn.addEventListener('click', exportExcel);

exportModal.addEventListener('click', (e) => {
    if (e.target === exportModal) {
        closeExportModal();
    }
});

exportWeek.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (exportYear) exportYear.focus();
    }
});

exportYear.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (doExportBtn) doExportBtn.click();
    }
});

// ============================================================
// START APP
// ============================================================
initApp();

window.addEventListener('resize', () => {
    if (video.videoWidth > 0) resizeCanvas();
    if (previewVideo.videoWidth > 0) resizePreviewCanvas();
});

window.addEventListener('beforeunload', () => {
    if (STATE.stream) STATE.stream.getTracks().forEach(t => t.stop());
    if (STATE.previewStream) STATE.previewStream.getTracks().forEach(t => t.stop());
    if (previewDetectInterval) clearInterval(previewDetectInterval);
});