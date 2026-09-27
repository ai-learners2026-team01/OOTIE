export function resolveSosIdentity({ mode, profile, authUser }) {
  if (!profile?.id) return { id: null, reason: '找不到使用者資料，請重新整理後再試。' };
  if (mode === 'REMOTE_READ') return { id: null, reason: '遠端檢視目前僅供閱讀，尚未開放送出。' };
  if (mode === 'FIXTURE') return { id: profile.id, reason: '' };
  // A real saved profile cannot keep acting after logout. The demo user is not a bypass.
  if (!authUser?.id && profile.user_id && profile.user_id !== 'user-01') {
    return { id: null, reason: '請登入這份個人資料所屬的帳號，再繼續操作。' };
  }
  if (authUser?.id && profile.user_id !== authUser.id) {
    return { id: null, reason: '登入帳號尚未連結到這份個人資料，暫時無法送出。可先使用多人體驗。' };
  }
  return { id: profile.id, reason: '' };
}
