// グローバル変数
let currentReservations = [];
let currentReservationNumber = '';

// Cloud Run API設定
const API_BASE_URL = 'https://reservation-conference-knn6yth7rq-an.a.run.app/api';

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    // ロゴ画像の表示制御（Safari対応）
    initLogoDisplay();
    
    // URLパラメータから予約情報を取得（reservation.htmlの場合）
    if (window.location.pathname.includes('reservation.html')) {
        loadReservationFromUrl();
    }
});

// ロゴ画像の表示制御（Safari対応）
function initLogoDisplay() {
    const logoImg = document.querySelector('.header-logo .logo-image') || document.querySelector('.header-logo img');
    const logoContainer = document.querySelector('.header-logo');
    
    if (logoImg && logoContainer) {
        logoImg.onload = function() {
            logoContainer.classList.add('has-image');
        };
        
        logoImg.onerror = function() {
            logoContainer.classList.remove('has-image');
        };
        
        // 既に画像が読み込まれている場合
        if (logoImg.complete && logoImg.naturalHeight !== 0) {
            logoContainer.classList.add('has-image');
        }
    }
}

// 予約確認処理
async function checkReservation() {
    const reservationNumber = document.getElementById('reservation-number').value.trim();
    const phoneNumber = document.getElementById('phone-number').value.trim();
    const errorMessage = document.getElementById('error-message');
    const loadingMessage = document.getElementById('loading-message');
    
    // バリデーション
    if (!reservationNumber || !phoneNumber) {
        showError('予約番号と電話番号を入力してください。');
        return;
    }
    
    if (!/^\d{8}$/.test(reservationNumber)) {
        showError('予約番号は8桁の数字で入力してください。');
        return;
    }
    
    // ローディング表示
    errorMessage.style.display = 'none';
    loadingMessage.style.display = 'block';
    
    try {
        const response = await fetch(`${API_BASE_URL}/check-reservation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                reservationNumber: reservationNumber,
                lastName: phoneNumber  // バックエンドAPIのlastNameパラメータに電話番号を送信
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'エラーが発生しました');
        }
        
        if (data.success && data.reservations && data.reservations.length > 0) {
            // 予約情報をURLパラメータとして渡して詳細ページに遷移
            const params = new URLSearchParams({
                number: reservationNumber,
                phone: phoneNumber  // パラメータ名を変更
            });
            window.location.href = `reservation.html?${params.toString()}`;
        } else {
            showError('該当する予約が見つかりませんでした。予約番号と電話番号を確認してください。');
        }
        
    } catch (error) {
        console.error('予約確認エラー:', error);
        showError('予約確認に失敗しました。時間をおいて再度お試しください。');
    } finally {
        loadingMessage.style.display = 'none';
    }
}

// URLパラメータから予約情報を読み込み
async function loadReservationFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const reservationNumber = params.get('number');
    const phoneNumber = params.get('phone');  // パラメータ名を変更
    
    if (!reservationNumber || !phoneNumber) {
        showError('不正なアクセスです。');
        return;
    }
    
    currentReservationNumber = reservationNumber;
    
    // ローディング表示
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
        loadingMessage.style.display = 'block';
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/check-reservation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                reservationNumber: reservationNumber,
                lastName: phoneNumber  // バックエンドAPIのlastNameパラメータに電話番号を送信
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'エラーが発生しました');
        }
        
        if (data.success && data.reservations) {
            currentReservations = data.reservations;
            displayReservationDetails(data.reservations);
        } else {
            showError('予約情報の取得に失敗しました。');
        }
        
    } catch (error) {
        console.error('予約情報取得エラー:', error);
        showError('予約情報の取得に失敗しました。');
    } finally {
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }
    }
}

// 予約詳細を表示
function displayReservationDetails(reservations) {
    const container = document.getElementById('reservation-details-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    reservations.forEach((reservation, index) => {
        const section = document.createElement('div');
        section.className = 'confirmation-section';
        
        const title = index === 0 ? '代表者' : `同行者${index}`;
        const statusText = getStatusText(reservation.states);
        const statusClass = getStatusClass(reservation.states);
        
        section.innerHTML = `
            <div class="confirmation-title">${title}の予約情報</div>
            <div class="confirmation-item">
                <span class="confirmation-label">予約番号</span>
                <span class="confirmation-value">${reservation.reservationNumber}</span>
            </div>
            <div class="confirmation-item">
                <span class="confirmation-label">お名前</span>
                <span class="confirmation-value">${reservation['Name-f']}</span>
            </div>
            <div class="confirmation-item">
                <span class="confirmation-label">電話番号</span>
                <span class="confirmation-value">${reservation['Name-s'] === '同行者' ? '同行者として登録' : reservation['Name-s']}</span>
            </div>
            <div class="confirmation-item">
                <span class="confirmation-label">メニュー</span>
                <span class="confirmation-value">${reservation.Menu}</span>
            </div>
            <div class="confirmation-item">
                <span class="confirmation-label">予約日時</span>
                <span class="confirmation-value">${reservation.date} ${reservation.Time}</span>
            </div>
            <div class="confirmation-item">
                <span class="confirmation-label">施術時間</span>
                <span class="confirmation-value">約${reservation.WorkTime}分</span>
            </div>
            <div class="confirmation-item">
                <span class="confirmation-label">メールアドレス</span>
                <span class="confirmation-value">${reservation.mail === '同行者' ? '同行者として登録' : reservation.mail}</span>
            </div>
            <div class="confirmation-item">
                <span class="confirmation-label">ステータス</span>
                <span class="confirmation-value">
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </span>
            </div>
        `;
        
        container.appendChild(section);
    });
    
    // キャンセルボタンの有効/無効を設定
    updateCancelButtonState(reservations);
}

// ステータステキストを取得
function getStatusText(states) {
    switch (states) {
        case 0: return '予約済み';
        case 1: return '来店済み';
        case 2: return 'キャンセル済み';
        default: return '不明';
    }
}

// ステータスクラスを取得
function getStatusClass(states) {
    switch (states) {
        case 0: return 'status-reserved';
        case 1: return 'status-visited';
        case 2: return 'status-cancelled';
        default: return 'status-reserved';
    }
}

// キャンセルボタンの状態を更新
function updateCancelButtonState(reservations) {
    const cancelButton = document.getElementById('cancel-button');
    if (!cancelButton) return;
    
    // 全ての予約がキャンセル可能かチェック
    const canCancel = reservations.every(reservation => {
        if (reservation.states !== 0) {
            return false; // 予約済み以外はキャンセル不可
        }
        
        // 現在時刻と予約時刻を比較
        const now = new Date();
        const reservationDateTime = new Date(`${reservation.date}T${reservation.Time}:00`);
        const timeDifference = reservationDateTime.getTime() - now.getTime();
        const hoursDifference = timeDifference / (1000 * 60 * 60);
        
        return hoursDifference >= 1; // 1時間以上前かチェック
    });
    
    if (canCancel && reservations.some(r => r.states === 0)) {
        cancelButton.disabled = false;
        cancelButton.textContent = 'キャンセル';
    } else {
        cancelButton.disabled = true;
        cancelButton.textContent = 'キャンセル不可';
    }
}

// キャンセル確認
function confirmCancel() {
    if (!confirm('本当にキャンセルしますか？\n\nキャンセル後の取り消しはできません。')) {
        return;
    }
    
    cancelReservation();
}

// 予約キャンセル処理
async function cancelReservation() {
    const loadingMessage = document.getElementById('loading-message');
    
    // ローディング表示
    if (loadingMessage) {
        loadingMessage.style.display = 'block';
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/cancel-reservation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                reservationNumber: currentReservationNumber
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'キャンセルに失敗しました');
        }
        
        if (data.success) {
            // キャンセル完了ページに遷移
            window.location.href = 'cancel-complete.html';
        } else {
            showError('キャンセルに失敗しました。');
        }
        
    } catch (error) {
        console.error('キャンセルエラー:', error);
        showError('キャンセル処理に失敗しました。時間をおいて再度お試しください。');
    } finally {
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }
    }
}

// 戻るボタン
function goBack() {
    window.location.href = 'index.html';
}

// エラー表示
function showError(message) {
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    } else {
        alert(message);
    }
}

// Enter キーでフォーム送信
document.addEventListener('keypress', function(event) {
    if (event.key === 'Enter' && document.getElementById('reservation-number')) {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.id === 'reservation-number' || activeElement.id === 'phone-number')) {
            checkReservation();
        }
    }
});
