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

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

console.log('🔥 Firebase Realtime Database initialized');

// ============================================================
// ACCESS CODE
// ============================================================
const ACCESS_CODE = "zaki5go";

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
    }
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
const registerName = document.getElementById('registerName');
const accessCode = document.getElementById('accessCode');
const registerBtn = document.getElementById('registerBtn');
const registerStatus = document.getElementById('registerStatus');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const syncBtn = document.getElementById('syncBtn');
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
                        type: item.type || 'check_in'
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
// AUTO ATTENDANCE FUNCTIONS
// ============================================================
async function autoAbsen(name, id) {
    const now = Date.now();
    if (STATE.autoAbsenCooldown[id] && (now - STATE.autoAbsenCooldown[id] < 5000)) {
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour12: false });

    const existingHistory = STATE.attendanceHistory.find(h =>
        h.name === name && h.date === today
    );

    try {
        if (existingHistory) {
            // UPDATE: sudah absen, update waktu terakhir
            const record = {
                name: name,
                status: 'hadir',
                type: 'update_time',
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                date: today,
                time: timeStr,
                clientTime: new Date().toISOString()
            };

            await db.ref('attendance/' + today + '/individuals/' + existingHistory.id).remove();

            const ref = db.ref('attendance/' + today + '/individuals').push();
            await ref.set(record);

            const index = STATE.attendanceHistory.findIndex(h => h.id === existingHistory.id);
            if (index !== -1) {
                STATE.attendanceHistory[index] = {
                    id: ref.key,
                    name: name,
                    status: 'hadir',
                    time: timeStr,
                    date: today,
                    timestamp: Date.now(),
                    type: 'update_time'
                };
            }

            STATE.updateCount++;
            STATE.lastUpdateTime = Date.now();
            STATE.autoAbsenCooldown[id] = Date.now();

            renderHistory();
            updateStatusBar();

            showToast(`🔄 ${name} update waktu: ${timeStr}`, 'update');
            console.log(`🔄 Update waktu: ${name} -> ${timeStr}`);

        } else {
            // ABSEN BARU: pertama kali absen hari ini
            const record = {
                name: name,
                status: 'hadir',
                type: 'auto_check_in',
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                date: today,
                time: timeStr,
                clientTime: new Date().toISOString()
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
                type: 'auto_check_in'
            });

            STATE.attendance[id] = true;
            STATE.autoAbsenCooldown[id] = Date.now();

            renderList();
            renderHistory();
            updateAbsenCount();
            updateStatusBar();

            showToast(`✅ ${name} berhasil absen otomatis! (${timeStr})`, 'auto');
            console.log(`✅ Auto absen: ${name} pada ${timeStr}`);
        }

    } catch (error) {
        console.error('❌ Gagal auto absen/update:', error);
    }
}

// ============================================================
// RENDER FUNCTIONS
// ============================================================
function renderList() {
    const list = STATE.registered;
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
        html += `
                    <div class="face-item" data-id="${item.id}">
                        <div class="name">
                            <i class="fas fa-user-circle"></i>
                            <span>${item.name}</span>
                            ${hadir ? `<span style="font-size:0.6rem;color:#b06af0;margin-left:0.3rem;"><i class="fas fa-magic"></i> ${hasUpdate ? 'updated' : 'auto'}</span>` : ''}
                        </div>
                        <span class="status-badge ${statusClass}">${statusLabel} ${hasUpdate ? '🔄' : ''}</span>
                        <button class="btn-hapus" data-id="${item.id}" title="Hapus">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
    });
    faceListEl.innerHTML = html;

    faceListEl.querySelectorAll('.btn-hapus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.dataset.id;
            hapusWajah(id);
        });
    });
}

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

    todayHistory.slice(0, 15).forEach(item => {
        const statusClass = item.status === 'hadir' ? 'hadir' : 'tidak';
        const statusLabel = item.status === 'hadir' ? '✔ Hadir' : '✘ Tidak';
        const isAuto = item.type === 'auto_check_in';
        const isUpdate = item.type === 'update_time';
        let badge = '';
        if (isAuto) badge = ' <span class="h-auto">auto</span>';
        if (isUpdate) badge = ' <span class="h-update">update</span>';
        html += `
                    <div class="history-item">
                        <span class="h-name"><i class="fas fa-user"></i> ${item.name}</span>
                        <span class="h-status ${statusClass}">${statusLabel}${badge}</span>
                        <span class="h-time"><i class="fas fa-clock"></i> ${item.time || '--:--'}</span>
                    </div>
                `;
    });

    historyList.innerHTML = html;
}

// ============================================================
// CRUD
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

async function hapusWajah(id) {
    const face = STATE.registered.find(f => f.id === id);

    const deleted = await deleteFaceFromFirebase(id);
    if (!deleted) {
        showToast('❌ Gagal menghapus dari Firebase', 'error');
        return;
    }

    STATE.registered = STATE.registered.filter(item => item.id !== id);
    delete STATE.attendance[id];
    delete STATE.autoAbsenCooldown[id];

    renderList();
    STATE.lastSync = Date.now();
    updateLastSync();
    updateStatusBar();

    showToast(`🗑️ Wajah ${face?.name || id} dihapus dari Firebase`, 'info');
    registerStatus.textContent = 'Siap mendaftar';
}

async function resetSemua() {
    if (STATE.registered.length === 0) {
        showToast('Tidak ada data', 'info');
        return;
    }

    if (!confirm('⚠️ Yakin ingin menghapus SEMUA data dari Firebase? Tindakan ini tidak bisa dibatalkan!')) {
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

// ============================================================
// LOAD ALL MODELS
// ============================================================
async function loadAllModels() {
    const MODEL_URLS = [
        'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights',
        'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights'
    ];

    let lastError = null;

    for (const MODEL_URL of MODEL_URLS) {
        try {
            console.log(`Mencoba load model dari: ${MODEL_URL}`);
            modelStatus.innerHTML = `<i class="fas fa-spinner fa-pulse"></i> Mencoba: ${MODEL_URL.split('/').pop()}...`;
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
            showToast('✅ Model berhasil dimuat!', 'success');
            return true;

        } catch (err) {
            console.warn(`Gagal load dari ${MODEL_URL}:`, err.message);
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
    return false;
}

// ============================================================
// DETECTION LOOP WITH AUTO ABSEN
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
            updateStatusBar();
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
                    if (dist < minDist) {
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

                STATE.detectedFaces.push({ id: matchId, name: matchName });

                await autoAbsen(matchName, matchId);
            } else {
                ctx.fillText('👤 ?', x + 6, y - 6);
            }
        }

        ctx.shadowBlur = 0;
        updateStatusBar();

    } catch (err) {
        console.warn('Deteksi error:', err);
        detectionInfo.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Error: ${err.message}`;
        detectionInfo.className = 'info-badge error';
    }

    requestAnimationFrame(detectLoop);
}

// ============================================================
// START / STOP
// ============================================================
async function startDetection() {
    if (STATE.isDetecting) return;

    startBtn.disabled = true;
    setStatus(false, 'mengakses kamera...', true);

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
// REGISTER WITH ACCESS CODE
// ============================================================
async function registerFace() {
    const name = registerName.value.trim();
    const code = accessCode.value.trim();

    // Validasi nama
    if (!name) {
        showToast('Masukkan nama terlebih dahulu', 'error');
        registerStatus.textContent = '⚠️ Masukkan nama!';
        registerName.focus();
        return;
    }

    // Validasi kode akses
    if (!code) {
        showToast('Masukkan kode akses!', 'error');
        registerStatus.textContent = '⚠️ Masukkan kode akses!';
        accessCode.focus();
        return;
    }

    // Cek kode akses
    if (code !== ACCESS_CODE) {
        showToast('❌ Kode akses salah!', 'error');
        registerStatus.textContent = '❌ Kode akses salah!';
        accessCode.value = '';
        accessCode.focus();
        return;
    }

    if (!STATE.isDetecting || !video.videoWidth) {
        showToast('Aktifkan deteksi terlebih dahulu', 'error');
        registerStatus.textContent = '⚠️ Aktifkan deteksi dulu!';
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
        const detections = await faceapi.detectAllFaces(
            video,
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

        // Cek duplikat
        let duplicate = false;
        let duplicateName = '';
        for (const reg of STATE.registered) {
            if (!reg.descriptor || !reg.descriptor.length) continue;
            try {
                const regDesc = new Float32Array(reg.descriptor);
                const dist = faceapi.euclideanDistance(descriptor, regDesc);
                console.log(`Distance to "${reg.name}":`, dist);
                if (dist < 0.45) {
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
            registerName.value = '';
            accessCode.value = '';
            registerStatus.textContent = `✅ "${name}" terdaftar di Firebase!`;
            showToast(`✅ "${name}" berhasil didaftarkan!`, 'success');
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
    try {
        await db.ref('.info/connected').once('value');
        updateFirebaseStatus(true);
        console.log('✅ Firebase Realtime Database terhubung');

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

        console.log('👽 Face Attendance dengan Auto Absen & Update Time siap!');
        console.log('Data wajah:', STATE.registered.length, 'orang');

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
registerBtn.addEventListener('click', registerFace);

// Enter key pada input nama
registerName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        accessCode.focus();
    }
});

// Enter key pada input kode akses
accessCode.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        registerFace();
    }
});

// ============================================================
// START APP
// ============================================================
initApp();

window.addEventListener('resize', () => {
    if (video.videoWidth > 0) resizeCanvas();
});

window.addEventListener('beforeunload', () => {
    if (STATE.stream) STATE.stream.getTracks().forEach(t => t.stop());
});